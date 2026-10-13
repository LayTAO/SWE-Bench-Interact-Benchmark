import {test, expect} from '@playwright/test';
import fs from 'node:fs';

const mode = process.env.REPRO_MODE || 'patched';
const output = process.env.OUTPUT_DIR || '/results';
const errors: string[] = [];
const requestFailures: string[] = [];

test('DateField Enter preserves the focused day segment', async ({page}) => {
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => requestFailures.push(`${request.url()}: ${request.failure()?.errorText || 'unknown'}`));
  await page.goto(process.env.REPRO_URL || 'http://127.0.0.1:4173', {waitUntil: 'networkidle'});
  try {
    await expect(page.locator('main')).toBeVisible();
  } catch (error) {
    console.error(JSON.stringify({errors, requestFailures, body: await page.locator('body').innerHTML()}));
    throw error;
  }
  const day = page.locator('[data-type="day"]').first();
  await expect(day).toBeVisible();
  await day.click();
  await page.keyboard.press('Enter');
  const focused = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    return {type: element?.getAttribute('data-type'), role: element?.getAttribute('role'), label: element?.getAttribute('aria-label')};
  });
  const bugObserved = focused.type === 'month';
  const observation = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-5102', mode, environment_valid: true, rendering_valid: true, trigger_valid: true, bug_observed: bugObserved, focused, console_errors: errors, request_failures: requestFailures};
  fs.mkdirSync(output, {recursive: true});
  await page.screenshot({path: `${output}/${mode}-screenshot.png`, fullPage: false});
  fs.writeFileSync(`${output}/observation.json`, JSON.stringify(observation, null, 2) + '\n');
  expect(bugObserved).toBe(mode === 'buggy');
});
