import {test, expect} from '@playwright/test';
import fs from 'node:fs';

const mode = process.env.REPRO_MODE || 'patched';
const output = process.env.OUTPUT_DIR || '/results';
const errors: string[] = [];

test('TooltipTrigger preserves child tab-order properties', async ({page}) => {
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.REPRO_URL || 'http://127.0.0.1:4173', {waitUntil: 'networkidle'});
  await expect(page.locator('main')).toBeVisible();
  const buttons = page.getByRole('button');
  await expect(buttons).toHaveCount(2);
  const tabIndices = await buttons.evaluateAll(elements => elements.map(element => (element as HTMLElement).tabIndex));
  const bugObserved = tabIndices[0] !== -1 || tabIndices[1] !== 0;
  const observation = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-8556', mode, environment_valid: true, rendering_valid: true, trigger_valid: true, bug_observed: bugObserved, tab_indices: tabIndices, console_errors: errors};
  fs.mkdirSync(output, {recursive: true});
  await page.screenshot({path: `${output}/${mode}-screenshot.png`, fullPage: false});
  fs.writeFileSync(`${output}/observation.json`, JSON.stringify(observation, null, 2) + '\n');
  expect(bugObserved).toBe(mode === 'buggy');
});
