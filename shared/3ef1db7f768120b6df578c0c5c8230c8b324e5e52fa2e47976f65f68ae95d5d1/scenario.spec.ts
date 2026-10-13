import {test, expect} from '@playwright/test';
import fs from 'node:fs';

const mode = process.env.REPRO_MODE || 'patched';
const output = process.env.OUTPUT_DIR || '/results';
const errors: string[] = [];

test('Contextual help item reports selection state after selection', async ({page}) => {
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`requestfailed ${request.url()} ${request.failure()?.errorText || ''}`));
  await page.goto(process.env.REPRO_URL || 'http://127.0.0.1:4173', {waitUntil: 'networkidle'});
  try {
    await expect(page.locator('main')).toBeVisible();
  } catch (error) {
    console.log(`DEBUG_PAGE_ERRORS ${JSON.stringify(errors)}`);
    console.log(`DEBUG_BODY ${JSON.stringify(await page.locator('body').innerText().catch(() => ''))}`);
    throw error;
  }
  const item = page.getByRole('menuitemradio', {name: /Hello/});
  await expect(item).toBeVisible();
  await item.click();
  const checked = await item.getAttribute('aria-checked');
  const bugObserved = checked !== 'true';
  const observation = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-8871', mode, environment_valid: true, rendering_valid: true, trigger_valid: true, bug_observed: bugObserved, aria_checked: checked, console_errors: errors};
  fs.mkdirSync(output, {recursive: true});
  await page.screenshot({path: `${output}/${mode}-screenshot.png`, fullPage: false});
  fs.writeFileSync(`${output}/observation.json`, JSON.stringify(observation, null, 2) + '\n');
  expect(bugObserved).toBe(mode === 'buggy');
});
