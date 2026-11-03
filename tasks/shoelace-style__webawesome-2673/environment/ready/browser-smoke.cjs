// Uses the project's locked driver and its matching browser, without network.
const {createRequire} = require('node:module');
const requireRepo = createRequire('/workspace/repo/package.json');
const {chromium} = requireRepo('playwright');
(async () => {
  const browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.setContent(`<button onclick="this.textContent='clicked'">ready</button>`);
    await page.locator('button').click();
    if (await page.locator('button').textContent() !== 'clicked') throw Error('browser interaction failed');
    console.log(JSON.stringify({browser: await browser.version(), executable: chromium.executablePath(), interaction: 'passed'}));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
