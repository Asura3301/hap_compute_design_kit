const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {AxeBuilder} = require('@axe-core/playwright');

async function run() {
  const {startFixture} = await import('./aerofreight-fixture.mjs');
  let unblock;
  const allowBootstrap = new Promise(resolve => { unblock = resolve; });
  const fixture = await startFixture({allowBootstrap});
  const restricted = await startFixture({role: 'limited'});
  let browser;
  try {
    browser = await chromium.launch(process.env.DESIGN_KIT_CHROME ? {channel: 'chrome'} : {});
    const context = await browser.newContext({viewport: {width: 360, height: 800}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(fixture.url, {waitUntil: 'commit'});
    await page.getByText('Checking site access…').waitFor();
    assert.equal(await page.getByRole('heading', {name: 'Shipment operations'}).isVisible(), false);
    unblock();
    await page.getByRole('heading', {name: 'Shipment operations'}).waitFor();
    await page.getByRole('button', {name: /AF-1048/}).waitFor();
    assert.equal(await page.locator('#total').innerText(), '6');
    await page.getByRole('searchbox').fill('FRA');
    assert.equal(await page.locator('.shipment').count(), 1);
    await page.getByRole('button', {name: /AF-1048/}).press('Enter');
    await page.getByText('980 kg').waitFor();
    assert.equal(await page.locator('#timeline li').count(), 2);
    assert.match(page.url(), /shipment=desk-1048/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.map(value => value.id), []);
    await page.reload();
    await page.getByText('980 kg').waitFor();
    await page.setViewportSize({width: 1440, height: 1000});
    await page.locator('#filter').selectOption('Exception');
    assert.equal(await page.locator('.shipment').count(), 1);
    await page.getByRole('button', {name: /AF-1049/}).click();
    await page.getByText('1,240 kg').waitFor();
    if (process.env.DESK_SCREENSHOT) {
      await page.locator('#filter').selectOption('');
      await page.screenshot({path: process.env.DESK_SCREENSHOT, fullPage: true});
    }
    await page.goto(restricted.url + '/?shipment=desk-1048');
    await page.getByText('Your HAP role cannot read operation history.').waitFor();
    assert.equal(await page.locator('#total').innerText(), '1');
    await page.goto(restricted.url + '/?shipment=desk-1049');
    await page.getByText('This shipment is unavailable to your account.').waitFor();
    assert.deepEqual(errors, []);
    console.log('AeroFreight desk passed access gate, keyboard, mobile layout, deep link, filters, axe and role-isolation checks.');
  } finally {
    unblock();
    if (browser) await browser.close();
    await Promise.all([fixture.close(), restricted.close()]);
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
