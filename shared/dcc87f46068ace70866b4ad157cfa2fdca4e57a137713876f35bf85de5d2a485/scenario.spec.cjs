const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
test('opening a virtual submenu keeps the root combobox exposed to accessibility', async ({ page }) => {
  const observation = { mode: process.env.REPRO_MODE, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: null,
    page_errors: [], action_error: null, test_count: 1 };
  page.on('pageerror', error => observation.page_errors.push(error.message));
  try {
    await page.goto('/');
    await expect(page.locator('#oracle-ready')).toBeVisible();
    const input = page.getByTestId('combobox');
    await input.click();
    await expect(page.locator('#root-menu')).toBeVisible();
    const hidden = () => input.evaluate(el => !!el.closest('[aria-hidden="true"]'));
    expect(await hidden()).toBe(false);
    observation.rendering_valid = true;
    await input.press('ArrowDown');
    await input.press('ArrowRight');
    await expect(page.getByTestId('submenu')).toBeVisible();
    await page.waitForTimeout(100);
    observation.trigger_valid = await input.getAttribute('aria-activedescendant') === 'nested-trigger';
    observation.environment_valid = observation.page_errors.length === 0;
    observation.root_combobox_hidden = await hidden();
    observation.bug_observed = observation.root_combobox_hidden;
    expect(observation.environment_valid).toBe(true);
    expect(observation.trigger_valid).toBe(true);
    expect(observation.bug_observed).toBe(process.env.REPRO_MODE === 'buggy');
  } catch (error) { observation.action_error = error.message; throw error; }
  finally { fs.writeFileSync(process.env.OUTPUT_DIR + '/observation.json', JSON.stringify(observation, null, 2)); }
});
