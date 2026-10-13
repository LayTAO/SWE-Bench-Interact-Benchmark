import { expect, test } from '@playwright/test';

test('nested dropdown dismissal does not close its parent dialog', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('dialog: closed | menu: closed');
  await page.locator('#dialog-trigger').click();
  await expect(page.locator('#status')).toHaveText('dialog: open | menu: closed');
  await page.locator('#menu-trigger').click();
  await expect(page.locator('#status')).toHaveText('dialog: open | menu: open');
  await page.locator('#dialog-title').click({ force: true });
  await expect(page.locator('#status')).toHaveText('dialog: open | menu: closed');
  await expect(page.locator('#errors')).toHaveText('');
});
