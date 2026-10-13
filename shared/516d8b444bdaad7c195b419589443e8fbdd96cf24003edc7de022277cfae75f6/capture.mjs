import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [instanceId, variant, baseURL, outputDir] = process.argv.slice(2);
const executablePath = process.env.CHROMIUM_EXECUTABLE;
fs.mkdirSync(outputDir, { recursive: true });
const consoleErrors = [];
const pageErrors = [];
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const chromiumVersion = browser.version();
const context = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  recordVideo: { dir: path.join(outputDir, '.video'), size: { width: 1024, height: 768 } },
});
const page = await context.newPage();
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => pageErrors.push(error.message));
let measured = {};
let actionError = null;
try {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.locator('#outside').waitFor({ state: 'visible', timeout: 30_000 });
  // DismissableLayer registers its document listeners and layer ordering in effects.
  // Wait for those effects before issuing the single trusted outside interaction.
  await page.waitForTimeout(250);
  const readStatus = () => page.locator('#status').textContent();
  const initial = await readStatus();
  await page.locator('#outside').click();
  await page.waitForFunction(() => document.querySelector('#status')?.textContent?.includes('child: closed'));
  await page.waitForTimeout(200);
  const afterOutside = await readStatus();
  const errors = await page.locator('#errors').textContent();
  measured = {
    initial_state: initial,
    state_after_outside_click: afterOutside,
    page_error_text: errors,
    oracle_passed:
      initial === 'parent: open | child: open' &&
      afterOutside === 'parent: open | child: closed' &&
      errors === '',
  };
} catch (error) {
  actionError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  measured.oracle_passed = false;
}
await page.screenshot({ path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: true }).catch(() => {});
const video = page.video();
await page.close();
await context.close();
if (video) {
  const source = await video.path().catch(() => null);
  if (source && fs.existsSync(source)) fs.renameSync(source, path.join(outputDir, `${variant}-video.webm`));
}
await browser.close();
const observation = {
  instance_id: instanceId,
  variant,
  action_error: actionError,
  console_errors: consoleErrors,
  page_errors: pageErrors,
  chromium_version: chromiumVersion,
  chromium_executable: executablePath,
  viewport: { width: 1024, height: 768 },
  workers: 1,
  retries: 0,
  used_for_scoring: false,
  ...measured,
};
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(observation, null, 2)}\n`);
console.log(JSON.stringify(observation));
