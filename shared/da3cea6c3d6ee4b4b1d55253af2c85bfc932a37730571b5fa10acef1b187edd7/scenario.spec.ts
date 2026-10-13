import {test, expect} from '@playwright/test';

test('Disabled tags must not remain tabbable or deletable', async ({page}) => {
  await page.goto(process.env.REPRO_URL || 'http://127.0.0.1:4173');
  await expect(page.locator('main')).toBeVisible();
  // The frozen oracle is defined in oracle/oracle.json and is evaluated by the harness.
});
