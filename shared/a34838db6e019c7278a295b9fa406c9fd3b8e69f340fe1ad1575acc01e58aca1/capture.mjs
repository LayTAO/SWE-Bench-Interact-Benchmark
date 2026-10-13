import fs from "node:fs";
import path from "node:path";
import {chromium} from "/tooling/node_modules/playwright/index.mjs";

const [variant, baseURL, outputDir] = process.argv.slice(2);
const executablePath = process.env.CHROMIUM_EXECUTABLE;
if (!['buggy', 'fixed'].includes(variant) || !baseURL || !outputDir || !executablePath) {
  throw new Error('capture arguments missing');
}
fs.mkdirSync(outputDir, {recursive: true});
const observation = {
  schema_version: '1.0', instance_id: 'ariakit__ariakit-1652', variant,
  environment_valid: false, rendering_valid: false, trigger_valid: false,
  typed_value: false, first_clear_empty: false, first_clear_apple_focused: false,
  second_typed_value: false, clear_button_visible: false, clear_empty: false,
  final_apple_focused: false, final_apple_active: false,
  options_snapshot: [], combobox_attributes: {},
  console_errors: [], page_errors: [], bug_observed: false, oracle_passed: false,
};
const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
const context = await browser.newContext({viewport: {width: 960, height: 600}, recordVideo: {dir: path.join(outputDir, '.video'), size: {width: 960, height: 600}}});
await context.tracing.start({screenshots: true, snapshots: true, sources: true});
const page = await context.newPage();
page.on('console', message => { if (message.type() === 'error') observation.console_errors.push(message.text()); });
page.on('pageerror', error => observation.page_errors.push(String(error.message || error)));
try {
  await page.goto(baseURL, {waitUntil: 'networkidle'});
  const combobox = page.getByRole('combobox', {name: 'Your favorite food'});
  const clear = page.getByRole('button', {name: 'Clear input'});
  await combobox.waitFor({state: 'visible'});
  observation.environment_valid = true;
  observation.rendering_valid = await combobox.isVisible();
  observation.trigger_valid = true;
  await page.keyboard.press('Tab');
  await page.keyboard.type('a');
  observation.typed_value = await combobox.inputValue() === 'a';
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  observation.first_clear_empty = await combobox.inputValue() === '';
  const apple = page.getByRole('option', {name: 'Apple'});
  observation.first_clear_apple_focused = await apple.evaluate(element => element === document.activeElement);
  await page.keyboard.type('a');
  observation.second_typed_value = await combobox.inputValue() === 'a';
  await clear.waitFor({state: 'visible'});
  observation.clear_button_visible = true;
  await clear.click();
  observation.clear_empty = await combobox.inputValue() === '';
  await page.waitForTimeout(100);
  observation.final_apple_focused = await apple.evaluate(element => element === document.activeElement);
  observation.final_apple_active = await apple.getAttribute('aria-selected') === 'true' && await apple.getAttribute('data-active-item') !== null;
  observation.options_snapshot = await page.locator('[role="option"]').evaluateAll(elements => elements.map(element => ({text: element.textContent, ariaSelected: element.getAttribute('aria-selected'), dataActive: element.hasAttribute('data-active-item'), tabIndex: element.getAttribute('tabindex'), hidden: element.hidden})));
  observation.combobox_attributes = await combobox.evaluate(element => Object.fromEntries([...element.attributes].map(attribute => [attribute.name, attribute.value])));
  const clean = observation.console_errors.length === 0 && observation.page_errors.length === 0;
  observation.bug_observed = variant === 'buggy' && observation.typed_value && observation.first_clear_empty && !observation.first_clear_apple_focused && observation.second_typed_value && observation.clear_empty && observation.final_apple_active && clean;
  observation.oracle_passed = variant === 'fixed'
    ? observation.typed_value && observation.first_clear_empty && !observation.first_clear_apple_focused && observation.second_typed_value && observation.clear_empty && !observation.final_apple_active && clean
    : observation.bug_observed;
} catch (error) {
  observation.error = String(error && error.message || error);
}
await page.screenshot({path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: false});
const video = page.video();
await context.tracing.stop({path: path.join(outputDir, `${variant}-trace.zip`)});
await context.close();
if (video) { try { fs.renameSync(await video.path(), path.join(outputDir, `${variant}-video.webm`)); } catch {} }
await browser.close();
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(observation, null, 2)}\n`);
console.log(JSON.stringify(observation));
if (!observation.oracle_passed) process.exit(9);
