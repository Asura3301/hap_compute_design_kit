const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createServer} = require('node:http');
const {mkdtemp, readFile, rm, writeFile} = require('node:fs/promises');
const {tmpdir} = require('node:os');
const {join, resolve} = require('node:path');
const {chromium} = require('playwright');
const {AxeBuilder} = require('@axe-core/playwright');

const cli = resolve(__dirname, '../skills/hap-compute-design/bin/hap-design.mjs');
const run = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: 'utf8'}).trim();

async function verify() {
  const work = await mkdtemp(join(tmpdir(), 'hap-design-browser-'));
  let browser;
  let server;
  let planner;
  try {
    browser = await chromium.launch(process.env.DESIGN_KIT_CHROME ? {channel: 'chrome'} : {});
    const context = await browser.newContext({viewport: {width: 360, height: 800}});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    planner = new URL(run('new'));
    await page.goto(planner.href);
    for (const [field, value] of Object.entries({
      project: 'Depot', audience: 'Guests', task: 'Find opening hours', acceptance: 'Find Saturday hours',
    })) await page.locator('[name="' + field + '"]').fill(value);
    await page.locator('[name="style"]').selectOption('dark');
    await page.getByRole('button', {name: 'Preview screen plan'}).click();
    assert.match(await page.locator('#plan').innerText(), /Find opening hours/);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', {name: 'Download design brief'}).click();
    const json = join(work, 'brief.json');
    await (await downloadPromise).saveAs(json);
    await page.reload();
    await page.locator('#import').setInputFiles(json);
    await page.getByText('Brief loaded.', {exact: false}).waitFor();
    assert.equal(await page.locator('[name="style"]').inputValue(), 'dark');
    assert.equal(await page.locator('[name="project"]').inputValue(), 'Depot');
    assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v => v.id), []);
    await assertFits(page);

    const standalone = join(work, 'standalone');
    run('scaffold', json, '--template', 'standalone', '--out', standalone);
    const dispatch = join(work, 'dispatch');
    run('scaffold', json, '--template', 'dispatch', '--out', dispatch);
    const connected = join(work, 'connected');
    run('scaffold', json, '--template', 'dispatch', '--out', connected);
    const index = join(connected, 'public/index.html');
    await writeFile(index, (await readFile(index, 'utf8')).replace('name="dispatch-endpoint" content=""',
      'name="dispatch-endpoint" content="/api/orders"'));
    let scenario = 'failure';
    server = createServer(async (req, res) => {
      if (req.url === '/api/orders') {
        if (scenario === 'failure') return res.writeHead(503).end();
        if (scenario === 'denied') return res.writeHead(403).end();
        return res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(scenario === 'empty' ? [] :
          [{id: '2001', status: 'Ready', window: '09:00–10:00', nextAction: 'Confirm pickup.'}]));
      }
      const route = req.url.match(/^\/(standalone|dispatch|connected)\/(index\.html|ui\.css|theme\.css|dispatch\.js)$/);
      if (!route) return res.writeHead(404).end();
      try {
        const body = await readFile(join(work, route[1], 'public', route[2]));
        const types = {html: 'text/html', js: 'text/javascript', css: 'text/css'};
        res.writeHead(200, {'Content-Type': types[route[2].split('.').pop()]}).end(body);
      } catch {
        res.writeHead(404).end();
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    await page.goto(origin + '/standalone/index.html');
    await page.getByRole('link', {name: 'See opening hours'}).press('Enter');
    assert.match(page.url(), /#hours$/);
    await page.getByText('09:00–16:00').waitFor();
    await assertFits(page);
    await page.goto(origin + '/dispatch/index.html');
    await page.getByRole('searchbox').fill('1048');
    await page.locator('summary').press('Enter');
    await page.getByText('14:00–16:00').waitFor();
    await page.getByRole('searchbox').fill('missing');
    await page.getByText('No matching orders.').waitFor();
    assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(v => v.id), []);
    await assertFits(page);
    await page.goto(origin + '/connected/index.html');
    await page.getByText('Could not load orders. Try again.').waitFor();
    scenario = 'success';
    await page.getByRole('button', {name: 'Try again'}).click();
    await page.locator('summary').getByText('Order 2001 · Ready').waitFor();
    scenario = 'empty';
    await page.reload();
    await page.getByText('There are no orders to display.').waitFor();
    scenario = 'denied';
    await page.reload();
    await page.getByText('Orders are unavailable for this session.', {exact: false}).waitFor();
    assert.deepEqual(errors, []);
    console.log('Browser checks passed for brief export/import, keyboard, mobile layout, accessibility and adapter states.');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (planner) await rm(new URL('.', planner), {recursive: true});
    await rm(work, {recursive: true});
  }
}

async function assertFits(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
