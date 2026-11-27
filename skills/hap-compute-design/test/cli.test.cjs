const assert = require('node:assert/strict');
const {execFileSync, spawnSync} = require('node:child_process');
const {mkdtempSync, readFileSync, rmSync, writeFileSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join, resolve} = require('node:path');
const {test} = require('node:test');
const {normalizeBrief} = require('../assets/brief.js');

const brief = {
  version: 1, source: 'standalone', access: 'public', style: 'editorial', font: 'serif',
  density: 'roomy', device: 'both', project: 'Depot', audience: 'Guests',
  task: 'Find opening hours', acceptance: 'Read Saturday hours on a phone',
};
const cli = resolve(__dirname, '../bin/hap-design.mjs');

test('normalizes briefs and rejects incomplete, invalid and future briefs', () => {
  assert.equal(normalizeBrief(brief).style, 'editorial');
  assert.throws(() => normalizeBrief({...brief, source: 'hap'}), /app/);
  assert.throws(() => normalizeBrief({...brief, acceptance: '  '}), /acceptance/);
  assert.throws(() => normalizeBrief({...brief, version: 3}), /version/);
  assert.throws(() => normalizeBrief({...brief, style: 'unknown'}), /style/);
  assert.equal(normalizeBrief({...brief, app: 'ignored'}).app, undefined);
});

test('migrates the previous exported brief', () => {
  const migrated = normalizeBrief({...brief, version: undefined, source: 'Из приложения HAP',
    access: 'Публичная часть и личный кабинет', style: 'Тёплое редакционное',
    font: 'С засечками', density: 'Свободно', device: 'На телефоне и компьютере',
    app: 'app-1', appName: 'Dispatch',
  });
  assert.equal(migrated.version, 1);
  assert.equal(migrated.access, 'mixed');
  assert.equal(migrated.appName, 'Dispatch');
  assert.deepEqual(normalizeBrief(migrated), migrated);
});

test('CLI validates briefs and returns a self-contained planner', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hap-design-test-'));
  try {
    const run = (...args) => execFileSync(process.execPath, [cli, ...args], {cwd, encoding: 'utf8'}).trim();
    writeFileSync(join(cwd, 'brief.json'), JSON.stringify(brief));
    assert.equal(JSON.parse(run('check', 'brief.json')).project, 'Depot');
    assert.equal(spawnSync(process.execPath, [cli, 'check'], {cwd}).status, 1);
    const planner = new URL(run('styles'));
    try {
      const html = readFileSync(planner, 'utf8');
      assert.equal(planner.hash, '#appearance');
      assert.match(html, /function normalizeBrief/);
      assert.doesNotMatch(html, /src="brief.js"/);
    } finally {
      rmSync(new URL('.', planner), {recursive: true});
    }
  } finally {
    rmSync(cwd, {recursive: true});
  }
});

test('scaffolds themed assets and preserves an existing destination', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hap-design-scaffold-'));
  try {
    writeFileSync(join(cwd, 'brief.json'), JSON.stringify(brief));
    const args = [cli, 'scaffold', 'brief.json', '--template', 'dispatch', '--out', 'site'];
    assert.equal(spawnSync(process.execPath, args, {cwd}).status, 0);
    assert.match(readFileSync(join(cwd, 'site/public/theme.css'), 'utf8'), /Georgia/);
    assert.match(readFileSync(join(cwd, 'site/public/index.html'), 'utf8'), /dispatch\.js/);
    writeFileSync(join(cwd, 'site/public/index.html'), 'existing');
    assert.equal(spawnSync(process.execPath, args, {cwd}).status, 1);
    assert.equal(readFileSync(join(cwd, 'site/public/index.html'), 'utf8'), 'existing');
  } finally {
    rmSync(cwd, {recursive: true});
  }
});

test('uses the owner scope and never includes the PAT in the planner', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hap-design-apps-'));
  try {
    const preload = join(cwd, 'fetch.cjs');
    writeFileSync(preload, `
      globalThis.fetch = async (url, options) => {
        if (url.href !== 'https://example.test' + process.env.FIXTURE_PREFIX + '/v3/apps/list?orgId=org-1&permissionScope=owner' ||
            options.headers.Authorization !== 'Bearer fixture-pat' || options.redirect !== 'error') {
          throw Error('Unexpected app list request');
        }
        if (process.env.FIXTURE === 'denied') return new Response('', {status: 403});
        return Response.json({success: true, data: process.env.FIXTURE === 'empty' ? [] : [
          {appId: 'app-1', name: 'Dispatch & Co', isOwner: true},
          {appId: 'app-2', name: 'Hidden fixture', isOwner: false},
          {appId: 'app-3', name: 'Unverified fixture'},
        ]});
      };
    `);
    const call = (command, fixture, prefix = '') => spawnSync(process.execPath,
      ['--require', preload, cli, command, '--org', 'org-1', '--origin', 'https://example.test' + prefix],
      {cwd, encoding: 'utf8', env: {...process.env, HAP_PAT: 'fixture-pat', FIXTURE: fixture, FIXTURE_PREFIX: prefix}});
    const plannerResult = call('new', 'success');
    assert.equal(plannerResult.status, 0, plannerResult.stderr);
    const planner = new URL(plannerResult.stdout.trim());
    try {
      const html = readFileSync(planner, 'utf8');
      assert.match(html, /Dispatch &amp; Co/);
      assert.doesNotMatch(html, /fixture-pat|Hidden fixture|Unverified fixture/);
    } finally {
      rmSync(new URL('.', planner), {recursive: true});
    }
    assert.deepEqual(JSON.parse(call('apps', 'empty').stdout), []);
    assert.equal(JSON.parse(call('apps', 'success', '/api').stdout)[0].id, 'app-1');
    const denied = call('apps', 'denied');
    assert.equal(denied.status, 1);
    assert.match(denied.stderr, /HTTP 403/);
  } finally {
    rmSync(cwd, {recursive: true});
  }
});

test('requires workflow scope and a sign-in decision for a connected brief', () => {
  const form = {...brief, version: 2, mode: 'operate', source: 'hap', access: 'mixed',
    app: 'sample-id', appName: 'Service requests', scope: 'preserve', features: 'Submit a request',
    permissions: 'Requesters see their own records', publicPages: 'Help'};
  assert.throws(() => normalizeBrief(form), /sign in/);
  assert.throws(() => normalizeBrief({...form, login: 'existing'}), /loginNotes/);
  assert.throws(() => normalizeBrief({...form, login: 'hap', features: ''}), /features/);
  assert.equal(normalizeBrief({...form, login: 'hap'}).scope, 'preserve');
});

test('handoff requires the new decisions and preserves existing output', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'hap-design-handoff-'));
  try {
    const file = join(cwd, 'brief.json');
    const args = [cli, 'handoff', file, '--out', 'handoff'];
    writeFileSync(file, JSON.stringify(brief));
    assert.equal(spawnSync(process.execPath, args, {cwd}).status, 1);
    writeFileSync(file, JSON.stringify({...brief, version: 2, mode: 'read'}));
    assert.equal(spawnSync(process.execPath, args, {cwd}).status, 0);
    const product = join(cwd, 'handoff/PRODUCT.md');
    writeFileSync(product, 'Existing content');
    assert.equal(spawnSync(process.execPath, args, {cwd}).status, 1);
    assert.equal(readFileSync(product, 'utf8'), 'Existing content');
  } finally {
    rmSync(cwd, {recursive: true});
  }
});
