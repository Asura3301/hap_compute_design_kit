// Maintainer-only tool. Run with playwright, sharp and Chrome available.
const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function capture() {
  const root = path.join(__dirname, '..');
  const media = path.join(root, 'docs/media');
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: {width: 880, height: 820}, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(root, 'skills/hap-compute-design/assets/planner.html')).href);
    const appearance = page.locator('#appearance');
    const frames = [];
    for (const index of [0, 1, 2]) {
      await page.selectOption('[name="style"]', {index});
      await page.selectOption('[name="font"]', {index});
      await page.selectOption('[name="density"]', {index: index === 2 ? 1 : 0});
      frames.push(await appearance.screenshot());
    }
    await sharp(frames[0]).png().toFile(path.join(media, 'planner.png'));
    const sizes = await Promise.all(frames.map(frame => sharp(frame).metadata()));
    const height = Math.max(...sizes.map(size => size.height));
    const buffers = await Promise.all(frames.map((frame, i) => sharp(frame)
      .extend({bottom: height - sizes[i].height, top: 0, left: 0, right: 0, background: '#faf9f6'})
      .png().toBuffer()));
    await sharp(buffers, {join: {animated:true}}).gif({delay: [1800,1800,1800], loop: 0}).toFile(path.join(media, 'styles.gif'));
    const result = await sharp(path.join(media,'styles.gif'), {animated:true}).metadata();
    if (result.pages !== frames.length) throw Error('Missing animation frames');
  } finally {
    await browser.close();
  }
}
capture().catch(error => { console.error(error.message); process.exitCode = 1; });
