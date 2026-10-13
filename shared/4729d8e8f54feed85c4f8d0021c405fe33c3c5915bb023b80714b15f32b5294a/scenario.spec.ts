import {test, expect} from '@playwright/test';

test('DismissableLayer observes the current Escape handler', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('#status')).toHaveText('open-unblocked');
  await expect(page.locator('#block')).toBeVisible();
  await page.locator('#block').click();
  await expect(page.locator('#status')).toHaveText('open-blocked');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
  await expect(page.locator('#status')).toHaveText('open-blocked');
});
