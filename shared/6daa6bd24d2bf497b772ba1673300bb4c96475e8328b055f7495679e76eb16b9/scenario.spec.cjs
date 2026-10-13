const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

for (const kind of ['dialog', 'popover']) {
  test(`${kind} retains its focus trap after an outside click`, async ({ page }) => {
    const observation = {
      schema_version: '1.0', mode: process.env.REPRO_MODE, kind,
      environment_valid: false, rendering_valid: false, trigger_valid: false,
      bug_observed: null, test_count: 1, page_errors: [], action_error: null,
    };
    page.on('pageerror', error => observation.page_errors.push(error.message));
    try {
      await page.goto('/?kind=' + kind);
      await expect(page.locator('#oracle-ready')).toBeVisible();
      await page.getByTestId('trigger').click();
      const content = page.getByTestId('content');
      await expect(content).toBeVisible();
      await expect(page.getByTestId('open-state')).toHaveText('open');
      const inside = () => content.evaluate(el => el.contains(document.activeElement));
      await page.getByTestId('last').focus();
      await page.keyboard.press('Tab');
      await expect.poll(inside).toBe(true);
      observation.rendering_valid = true;
      await page.getByTestId('outside').evaluate(el => {
        window.__outsideClicks = 0;
        el.addEventListener('click', () => window.__outsideClicks++);
      });
      await page.getByTestId('outside').click();
      await expect(content).toBeVisible();
      await page.getByTestId('last').focus();
      await page.keyboard.press('Tab');
      observation.focus_inside_after = await inside();
      observation.outside_clicks = await page.evaluate(() => window.__outsideClicks);
      observation.trigger_valid = observation.outside_clicks === 1;
      observation.environment_valid = observation.page_errors.length === 0;
      observation.bug_observed = !observation.focus_inside_after;
      expect(observation.environment_valid).toBe(true);
      expect(observation.trigger_valid).toBe(true);
      expect(observation.bug_observed).toBe(process.env.REPRO_MODE === 'buggy');
    } catch (error) {
      observation.action_error = error.message;
      throw error;
    } finally {
      const root = process.env.OUTPUT_DIR;
      fs.writeFileSync(root + '/' + kind + '-observation.json', JSON.stringify(observation, null, 2));
      const records = ['dialog', 'popover'].map(name => root + '/' + name + '-observation.json')
        .filter(file => fs.existsSync(file)).map(file => JSON.parse(fs.readFileSync(file)));
      const all = field => records.length === 2 && records.every(row => row[field] === true);
      fs.writeFileSync(root + '/observation.json', JSON.stringify({
        environment_valid: all('environment_valid'), rendering_valid: all('rendering_valid'),
        trigger_valid: all('trigger_valid'), test_count: records.length,
        bug_observed: records.length === 2 ? records.some(row => row.bug_observed === true) : null,
        cases: records,
      }, null, 2));
    }
  });
}
