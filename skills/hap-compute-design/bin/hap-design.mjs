#!/usr/bin/env node
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import brief from '../assets/brief.js';

async function listApps(org, origin) {
  if (!org || !origin || !process.env.HAP_PAT) throw Error('Provide --org, --origin (your organization’s HTTPS API origin) and HAP_PAT.');
  const host = new URL(origin);
  if (host.protocol !== 'https:' || ![host.origin, host.origin + '/api'].includes(origin.replace(/\/$/, ''))) {
    throw Error('--origin must be an HTTPS API base URL with an optional /api suffix.');
  }
  const url = new URL((host.pathname === '/' ? '' : '/api') + '/v3/apps/list', host);
  url.searchParams.set('orgId', org);
  url.searchParams.set('permissionScope', 'owner');
  const response = await fetch(url, {headers: {Authorization: 'Bearer ' + process.env.HAP_PAT}, redirect: 'error', signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw Error('HAP request failed with HTTP ' + response.status);
  const body = await response.json();
  if (body?.success !== true) throw Error('HAP rejected the request. Verify the organization and PAT permissions.');
  const rows = Array.isArray(body.data) ? body.data : body.data?.apps;
  if (!Array.isArray(rows)) throw Error('Unrecognized app list format.');
  return rows.filter(a => a?.isOwner === true).map(a => {
    const id = a.appId ?? a.id, name = a.name ?? a.appName;
    if (typeof id !== 'string' || !id.trim() || typeof name !== 'string' || !name.trim()) {
      throw Error('An application is missing its ID or name.');
    }
    return {id, name};
  });
}

async function main() {
  const {positionals: [command, file, ...extra], values} = parseArgs({allowPositionals:true, options:{org:{type:'string'}, origin:{type:'string'}, out:{type:'string'}, template:{type:'string'}}});
  if (command === 'scaffold') {
    if (!file || extra.length || !values.out || !['standalone', 'dispatch'].includes(values.template) || values.org || values.origin) {
      throw Error('Usage: hap-design scaffold BRIEF.json --template standalone|dispatch --out NEW_DIRECTORY');
    }
    const data = brief.normalizeBrief(JSON.parse(await readFile(file, 'utf8')));
    if (data.source === 'hap' && values.template === 'standalone') throw Error('Use the dispatch starter for a HAP brief.');
    await scaffold(data, values.template, values.out);
    console.log(join(values.out, 'public', 'index.html'));
    return;
  }
  if (values.out || values.template || extra.length || (file && command !== 'check')) throw Error('Unexpected argument. Run hap-design help.');
  if (command === 'check') {
    if (!file) throw Error('Provide the path to a design brief.');
    if (values.org || values.origin) throw Error('The check command takes only a brief path.');
    const data = brief.normalizeBrief(JSON.parse(await readFile(file, 'utf8')));
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (!command || command === 'help') {
    console.log('hap-design new [--org ID --origin HTTPS_API_BASE]\nhap-design apps --org ID --origin HTTPS_API_BASE\nhap-design styles\nhap-design check BRIEF.json\nhap-design scaffold BRIEF.json --template standalone|dispatch --out NEW_DIRECTORY');
    return;
  }
  if (!['apps','new','styles'].includes(command)) throw Error('Unknown command. Run hap-design help.');
  const discover = command === 'apps' || (command === 'new' && (values.org || values.origin));
  if (command === 'styles' && (values.org || values.origin)) throw Error('The styles command takes no options.');
  const apps = discover ? await listApps(values.org, values.origin) : [];
  if (command === 'apps') return console.log(JSON.stringify(apps,null,2));
  const template = await readFile(new URL('../assets/planner.html',import.meta.url),'utf8');
  const validator = await readFile(new URL('../assets/brief.js', import.meta.url), 'utf8');
  const planner = template.replace('<script src="brief.js"></script>', () => '<script>\n' + validator + '\n</script>');
  const target = join(await mkdtemp(join(tmpdir(),'hap-design-')), 'planner.html');
  const options = apps.map(({id,name}) => '<option value="' + escapeHtml(id) + '">' + escapeHtml(name) + '</option>').join('');
  await writeFile(target,planner.replace('data-discovery="false"', 'data-discovery="' + Boolean(discover) + '"').replace('<!-- APPS -->', () => options),{mode:0o600});
  console.log(pathToFileURL(target).href + (command === 'styles' ? '#appearance' : ''));
}
async function scaffold(data, template, output) {
  const target = join(output, 'public');
  const asset = path => new URL('../assets/' + path, import.meta.url);
  await mkdir(output);
  await mkdir(target);
  const source = template === 'standalone' ? 'standalone.html' : 'dispatch/index.html';
  await cp(asset('templates/' + source), join(target, 'index.html'));
  if (template === 'dispatch') await cp(asset('templates/dispatch/dispatch.js'), join(target, 'dispatch.js'));
  await cp(asset('components/ui.css'), join(target, 'ui.css'));
  const rules = Object.entries(brief.designTokens(data)).map(([key, value]) => '  --' + key + ': ' + value + ';');
  await writeFile(join(target, 'theme.css'), ':root {\n' + rules.join('\n') + '\n}\n');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
main().catch(error => {console.error(error.message); process.exitCode=1;});
