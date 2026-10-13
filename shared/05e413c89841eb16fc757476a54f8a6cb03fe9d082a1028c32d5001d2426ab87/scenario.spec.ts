import {test, expect} from '@playwright/test';
import fs from 'node:fs';

const mode = process.env.REPRO_MODE || 'patched';
const output = process.env.OUTPUT_DIR || '/results';
const errors: string[] = [];

test('Tabs expose data-focused after clicking the selected tab', async ({page}) => {
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.REPRO_URL || 'http://127.0.0.1:4173', {waitUntil: 'networkidle'});
  await expect(page.locator('main')).toBeVisible();
  const tab = page.getByRole('tab', {name: 'One'});
  await expect(tab).toBeVisible();
  await tab.click();
  const dataFocused = await tab.getAttribute('data-focused');
  const bugObserved = dataFocused !== 'true';
  const observation = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-5973', mode, environment_valid: true, rendering_valid: true, trigger_valid: true, bug_observed: bugObserved, data_focused: dataFocused, console_errors: errors};
  fs.mkdirSync(output, {recursive: true});
  await page.screenshot({path: `${output}/${mode}-screenshot.png`, fullPage: false});
  fs.writeFileSync(`${output}/observation.json`, JSON.stringify(observation, null, 2) + '\n');
  expect(bugObserved).toBe(mode === 'buggy');
});
