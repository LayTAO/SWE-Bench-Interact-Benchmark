const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
for (const kind of ['start', 'end', 'converge']) {
  test(`adjusting ${kind} keeps the automatic endpoint within enabled dates`, async ({ page }) => {
    const observation = { kind, mode: process.env.REPRO_MODE, environment_valid: false,
      rendering_valid: false, trigger_valid: false, bug_observed: null,
      page_errors: [], action_error: null };
    page.on('pageerror', error => observation.page_errors.push(error.message));
    try {
      await page.goto('/?kind=' + kind);
      await expect(page.locator('#oracle-ready')).toBeVisible();
      const dates = page.locator('.el-date-range-picker__time-header .el-date-range-picker__editors-wrap');
      const input = dates.nth(kind === 'end' ? 1 : 0).locator('.el-date-range-picker__time-picker-wrap').first().locator('input');
      await expect(input).toBeVisible();
      observation.rendering_valid = true;
      const typed = kind === 'end' ? '2026-06-08' : '2026-08-20';
      await input.fill(typed);
      await input.press('Tab');
      const changed = page.getByTestId(kind === 'end' ? 'end-date' : 'start-date');
      await expect(changed).toHaveText(typed);
      observation.start_date = await page.getByTestId('start-date').textContent();
      observation.end_date = await page.getByTestId('end-date').textContent();
      observation.trigger_valid = Number(await page.getByTestId('commits').textContent()) > 0;
      observation.environment_valid = observation.page_errors.length === 0;
      observation.bug_observed = kind === 'end' ? observation.start_date < '2026-06-05'
        : kind === 'converge' ? observation.end_date !== '2026-08-20' : observation.end_date > '2026-09-17';
      expect(observation.environment_valid).toBe(true);
      expect(observation.trigger_valid).toBe(true);
      expect(observation.bug_observed).toBe(process.env.REPRO_MODE === 'buggy');
    } catch (error) { observation.action_error = error.message; throw error; }
    finally {
      const root = process.env.OUTPUT_DIR;
      fs.writeFileSync(root + '/' + kind + '-observation.json', JSON.stringify(observation, null, 2));
      const cases = ['start', 'end', 'converge'].map(name => root + '/' + name + '-observation.json')
        .filter(file => fs.existsSync(file)).map(file => JSON.parse(fs.readFileSync(file)));
      fs.writeFileSync(root + '/observation.json', JSON.stringify({ test_count: cases.length, cases }, null, 2));
    }
  });
}
