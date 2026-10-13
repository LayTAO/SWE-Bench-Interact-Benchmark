const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

test('an open tooltip closes when its trigger ancestor scrolls', async ({ page }) => {
  const observation = {
    schema_version: '1.0', mode: process.env.REPRO_MODE,
    environment_valid: false, rendering_valid: false, trigger_valid: false,
    bug_observed: null, test_count: 1, page_errors: [], action_error: null,
  };
  page.on('pageerror', error => observation.page_errors.push(error.message));
  try {
    await page.goto('/');
    await expect(page.locator('#oracle-ready')).toBeVisible();
    const trigger = page.getByTestId('trigger');
    const tooltip = page.getByTestId('tooltip');
    await expect(trigger).toBeVisible();
    await trigger.hover();
    await expect(tooltip).toBeVisible();
    observation.rendering_valid = true;
    // Keep the pointer stationary: scrolling must close the tooltip, without a
    // pointerleave masking the missing ancestor-scroll listener.
    await page.locator('#scroll-area').evaluate(element => {
      window.__scrollEvents = 0;
      element.addEventListener('scroll', () => window.__scrollEvents++);
      element.scrollTop = 20;
    });
    await expect.poll(() => page.evaluate(() => window.__scrollEvents)).toBeGreaterThan(0);
    await page.waitForTimeout(150);
    observation.scroll_events = await page.evaluate(() => window.__scrollEvents);
    observation.scroll_top = await page.locator('#scroll-area').evaluate(element => element.scrollTop);
    observation.trigger_valid = observation.scroll_events > 0 && observation.scroll_top > 0;
    observation.environment_valid = observation.page_errors.length === 0;
    observation.bug_observed = await tooltip.isVisible();
    expect(observation.environment_valid).toBe(true);
    expect(observation.trigger_valid).toBe(true);
    expect(observation.bug_observed).toBe(process.env.REPRO_MODE === 'buggy');
  } catch (error) {
    observation.action_error = error.message;
    throw error;
  } finally {
    fs.writeFileSync(process.env.OUTPUT_DIR + '/observation.json', JSON.stringify(observation, null, 2));
  }
});
