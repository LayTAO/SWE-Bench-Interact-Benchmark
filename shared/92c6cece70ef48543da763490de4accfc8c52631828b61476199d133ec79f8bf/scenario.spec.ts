import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const subjectDir = process.env.SUBJECT_DIR;
const outputDir = process.env.OUTPUT_DIR;
const expectedReopenChange = process.env.EXPECTED_REOPEN_CHANGE;
if (!subjectDir || !outputDir || !expectedReopenChange) {
  throw new Error('SUBJECT_DIR, OUTPUT_DIR, and EXPECTED_REOPEN_CHANGE are required');
}

const requireFromSubject = createRequire(path.join(subjectDir, 'package.json'));
const { chromium } = requireFromSubject('playwright');
fs.mkdirSync(outputDir, { recursive: true });

const errors = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN,
  headless: true,
  args: ['--no-sandbox']
});
const context = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  recordVideo: { dir: outputDir, size: { width: 1024, height: 768 } }
});
const page = await context.newPage();
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', error => errors.push(String(error)));

await page.goto('http://127.0.0.1:4174', { waitUntil: 'networkidle' });
await page.waitForFunction(() => customElements.get('nimble-select'));
await page.waitForFunction(() => {
  const select = document.querySelector('#target');
  return select && select.displayValue === 'Alpha';
});

const select = page.locator('#target');
await select.focus();
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelector('#target')?.open === true);
const filterInput = select.locator('input.filter-input');
await filterInput.fill('Br');
await page.waitForFunction(() => document.querySelector('#target')?.filter === 'Br');

const afterFilter = await page.evaluate(() => {
  const element = document.querySelector('#target');
  return {
    value: element.value,
    displayValue: element.displayValue,
    selectedIndex: element.selectedIndex,
    open: element.open,
    filter: element.filter
  };
});

await page.evaluate(() => {
  const element = document.querySelector('#target');
  const next = document.querySelector('#after');
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true })
  );
  element.dispatchEvent(
    new FocusEvent('focusout', {
      bubbles: true,
      composed: true,
      relatedTarget: next
    })
  );
  next.focus();
});
await page.waitForFunction(() => document.querySelector('#target')?.open === false);
const activeAfterTab = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
if (activeAfterTab !== 'after') {
  throw new Error(`Tab did not move focus to the control after the select: ${activeAfterTab}`);
}
const afterTabAway = await page.evaluate(() => {
  const element = document.querySelector('#target');
  return {
    value: element.value,
    displayValue: element.displayValue,
    selectedIndex: element.selectedIndex,
    open: element.open,
    filter: element.filter
  };
});
await select.focus();
await page.keyboard.press('Enter');
await page.waitForFunction(() => document.querySelector('#target')?.open === true);
await page.waitForTimeout(100);

const finalState = await page.evaluate(() => {
  const element = document.querySelector('#target');
  return {
    value: element.value,
    displayValue: element.displayValue,
    selectedIndex: element.selectedIndex,
    open: element.open,
    filter: element.filter,
    activeElement: document.activeElement?.id || document.activeElement?.tagName
  };
});
const reopenedValueChanged = afterTabAway.displayValue !== finalState.displayValue;
const observation = {
  afterFilter,
  afterTabAway,
  activeAfterTab,
  finalState,
  reopenedValueChanged,
  errors
};
await page.evaluate(value => {
  document.querySelector('#oracle').textContent = JSON.stringify(value, null, 2);
}, observation);
await page.screenshot({ path: path.join(outputDir, 'final-state.png') });
fs.writeFileSync(
  path.join(outputDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`
);

if (reopenedValueChanged !== (expectedReopenChange === 'true')) {
  throw new Error(
    `Expected reopenedValueChanged=${expectedReopenChange}, observed ${reopenedValueChanged}`
  );
}
if (errors.length !== 0) {
  throw new Error(`Console errors: ${errors.join(' | ')}`);
}

await page.close();
await context.close();
await browser.close();
const video = fs.readdirSync(outputDir).find(file => file.endsWith('.webm'));
if (!video) throw new Error('Playwright did not produce a video');
fs.renameSync(path.join(outputDir, video), path.join(outputDir, 'repro.webm'));
