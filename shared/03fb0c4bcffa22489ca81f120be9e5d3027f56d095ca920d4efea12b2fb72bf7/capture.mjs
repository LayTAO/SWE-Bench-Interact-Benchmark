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
  schema_version: '1.0', instance_id: 'ariakit__ariakit-6310', variant,
  environment_valid: false, rendering_valid: false, trigger_valid: false,
  first_open_choose_file_focused: false, close_disclosure_focused: false,
  close_choose_file_tabindex: null, reopen_choose_file_focused: false,
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
  const disclosure = page.getByRole('button', {name: 'Attachments'});
  const choose = page.getByRole('button', {name: 'Choose file'});
  const chooseHidden = page.getByRole('button', {name: 'Choose file', includeHidden: true}).last();
  const dialog = page.getByRole('dialog', {name: 'Attachments'});
  await disclosure.waitFor({state: 'visible'});
  observation.environment_valid = true;
  observation.rendering_valid = await disclosure.isVisible();
  observation.trigger_valid = true;
  await disclosure.click();
  await dialog.waitFor({state: 'visible'});
  observation.first_open_choose_file_focused = await choose.evaluate(element => element === document.activeElement);
  await disclosure.click({delay: 200});
  await dialog.waitFor({state: 'hidden'});
  observation.close_disclosure_focused = await disclosure.evaluate(element => element === document.activeElement);
  observation.close_choose_file_tabindex = await chooseHidden.getAttribute('tabindex');
  await disclosure.click();
  await dialog.waitFor({state: 'visible'});
  observation.reopen_choose_file_focused = await choose.evaluate(element => element === document.activeElement);
  const clean = observation.console_errors.length === 0 && observation.page_errors.length === 0;
  observation.bug_observed = variant === 'buggy' && observation.first_open_choose_file_focused && observation.close_disclosure_focused && observation.close_choose_file_tabindex === '-1' && !observation.reopen_choose_file_focused && clean;
  observation.oracle_passed = variant === 'fixed'
    ? observation.first_open_choose_file_focused && observation.close_disclosure_focused && observation.close_choose_file_tabindex === '-1' && observation.reopen_choose_file_focused && clean
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
