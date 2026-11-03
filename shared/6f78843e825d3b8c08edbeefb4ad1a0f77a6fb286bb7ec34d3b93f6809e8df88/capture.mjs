import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const [instanceId, variant, baseURL, evidenceDir] = process.argv.slice(2);
if (!instanceId || !variant || !baseURL || !evidenceDir) throw new Error('missing capture arguments');
const executablePath = process.env.CHROMIUM_EXECUTABLE;
fs.mkdirSync(evidenceDir, {recursive: true});
const videoDir = path.join(evidenceDir, '.video');
fs.mkdirSync(videoDir, {recursive: true});
const consoleErrors = [];
const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
const context = await browser.newContext({viewport: {width: 960, height: 600}, recordVideo: {dir: videoDir, size: {width: 960, height: 600}}});
await context.tracing.start({screenshots: true, snapshots: true, sources: true});
const page = await context.newPage();
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
// PRESERVE_FAILED_BROWSER_EVIDENCE
const networkErrors = [];
const rawConsoleErrors = [];
page.on('console', message => { if (message.type() === 'error') rawConsoleErrors.push(message.text()); });
page.on('pageerror', error => rawConsoleErrors.push(error.message));
page.on('requestfailed', request => networkErrors.push({url: request.url(), error: request.failure()}));
page.on('response', response => { if (response.status() >= 400) networkErrors.push({url: response.url(), status: response.status()}); });
let observation;
let actionError = null;
let failureBody = null;
try {
await page.goto(`${baseURL}/.interactrepair-repro/index.html`, {waitUntil: 'domcontentloaded', timeout: 60000});
await page.waitForTimeout(3000);
// Keep application failures, but discard only the known Vite optimizer noise
// that can be emitted before the frozen reproduction is ready.
for (let index = consoleErrors.length - 1; index >= 0; index--) {
  if (/504|Outdated Optimize Dep|dependency optimizer/i.test(consoleErrors[index])) consoleErrors.splice(index, 1);
}

const input = page.getByRole('combobox', {name: 'Fruit'});
if (await input.count() !== 1) {
  throw new Error(`Carbon Combobox did not render. Console: ${JSON.stringify(consoleErrors)} Body: ${(await page.locator('body').innerText()).slice(0, 1200)}`);
}
await input.click();
await page.getByRole('option', {name: 'Apple'}).click();
await input.focus();
await page.keyboard.press('Tab');
const focus = await page.evaluate(() => {
  const active = document.activeElement;
  return {documentId: active?.id ?? null, documentTag: active?.tagName ?? null, shadowId: active?.shadowRoot?.activeElement?.id ?? null};
});
const oraclePassed = focus.documentId === 'after';
observation = {
  action: 'Select an item and press Tab once',
  focus_after_tab: focus,
  oracle_passed: oraclePassed,
};

} catch (error) {
  actionError = String(error.stack || error);
  failureBody = await page.locator('body').innerText({timeout: 3000}).catch(() => null);
  // No target observation exists: an action/startup failure is not bug evidence.
  observation = {environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: null};
}
const evidenceErrors = [];
async function preserve(action) {
  try { await action(); } catch (error) { evidenceErrors.push(String(error)); }
}
await preserve(() => page.screenshot({path: path.join(evidenceDir, `${variant}-screenshot.png`), fullPage: true, timeout: 5000}));
await preserve(async () => fs.writeFileSync(path.join(evidenceDir, `${variant}-page.html`), await page.content()));
const video = page.video();
await preserve(() => context.tracing.stop({path: path.join(evidenceDir, `${variant}-trace.zip`)}));
await preserve(() => context.close());
if (video) await preserve(async () => fs.renameSync(await video.path(), path.join(evidenceDir, `${variant}-video.webm`)));
await preserve(() => browser.close());
const payload = {schema_version: '1.0', instance_id: instanceId, variant, chromium_version: '145.0.7632.6', chromium_executable: executablePath, viewport: {width: 960, height: 600}, workers: 1, retries: 0, used_for_scoring: false, ...observation, action_error: actionError, failure_body: failureBody, network_errors: networkErrors, raw_console_errors: rawConsoleErrors, evidence_errors: evidenceErrors, console_errors: consoleErrors};
fs.writeFileSync(path.join(evidenceDir, 'observation.json'), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload, null, 2));
const expectedPredicate = variant === 'buggy' ? !observation.oracle_passed : observation.oracle_passed;
if (!expectedPredicate) process.exitCode = 9;

if (actionError || evidenceErrors.length) process.exitCode = 1;
