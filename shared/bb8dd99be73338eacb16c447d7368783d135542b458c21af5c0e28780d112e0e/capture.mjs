import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '/tooling/node_modules/playwright-core/index.mjs';

const [instanceId, variant, url, resultsDir] = process.argv.slice(2);
if (!instanceId || !variant || !url || !resultsDir) {
  throw new Error('usage: capture.mjs INSTANCE VARIANT URL RESULTS_DIR');
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  recordVideo: { dir: resultsDir, size: { width: 1024, height: 768 } },
});
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const page = await context.newPage();
const video = page.video();
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.stack || error}`));
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('#oracle-ready').waitFor({ state: 'attached' });

let measured;
if (instanceId === 'IR-M-180') {
  const button = page.getByRole('button', { name: /more options/i });
  const background = page.locator('[role="presentation"].is-visible').first();
  await button.click();
  const before = await button.getAttribute('aria-expanded');
  await background.click({ position: { x: 4, y: 4 }, force: true });
  await page.waitForTimeout(250);
  const after = await button.getAttribute('aria-expanded');
  const modalVisible = await background.isVisible();
  measured = {
    interaction: 'open the overflow menu, then click the visible modal background layer',
    expanded_before_background_click: before,
    expanded_after_background_click: after,
    modal_still_visible: modalVisible,
    oracle_passed: before === 'true' && after === 'false' && modalVisible,
  };
} else if (instanceId === 'IR-M-210') {
  const select = page.getByTestId('select');
  await select.click();
  await page.waitForTimeout(250);
  const before = await select.getAttribute('aria-expanded');
  await select.click();
  await page.waitForTimeout(350);
  const after = await select.getAttribute('aria-expanded');
  measured = {
    interaction: 'click the Select trigger twice',
    expanded_after_first_click: before,
    expanded_after_second_click: after,
    oracle_passed: before === 'true' && after === 'false',
  };
} else if (instanceId === 'IR-M-229') {
  await page.getByRole('button', { name: 'Open themed menu' }).click();
  const paper = page.getByTestId('menu-paper');
  await paper.waitFor({ state: 'visible' });
  measured = await paper.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      interaction: 'open a Menu under conflicting MuiPaper, MuiPopover, and MuiMenu paper overrides',
      border_top_left_radius: style.borderTopLeftRadius,
      computed_height: style.height,
      bounding_height: rect.height,
      oracle_passed: style.borderTopLeftRadius === '4px' && style.height === '100px',
    };
  });
} else if (instanceId === 'IR-M-272') {
  const trigger = page.getByRole('button', { name: 'Learn' });
  await trigger.click();
  await page.waitForTimeout(250);
  const before = await trigger.getAttribute('data-state');
  await page.locator('a[href="#github"]').click();
  await page.waitForTimeout(350);
  const after = await trigger.getAttribute('data-state');
  measured = {
    interaction: 'open the NavigationMenu and click its top-level Github link',
    trigger_state_before_link_click: before,
    trigger_state_after_link_click: after,
    oracle_passed: before === 'open' && after === 'closed',
  };
} else {
  throw new Error(`unsupported instance: ${instanceId}`);
}

const screenshot = path.join(resultsDir, `${variant}-screenshot.png`);
await page.screenshot({ path: screenshot, fullPage: true });
const observation = {
  schema_version: '1.0',
  instance_id: instanceId,
  variant,
  chromium_version: browser.version(),
  viewport: { width: 1024, height: 768 },
  workers: 1,
  retries: 0,
  used_for_scoring: false,
  ...measured,
  console_messages: consoleMessages,
};
await fs.writeFile(
  path.join(resultsDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`,
);
await context.tracing.stop({ path: path.join(resultsDir, `${variant}-trace.zip`) });
await page.close();
await context.close();
if (video) {
  await video.saveAs(path.join(resultsDir, `${variant}-video.webm`));
}
await browser.close();
console.log(JSON.stringify(observation));
