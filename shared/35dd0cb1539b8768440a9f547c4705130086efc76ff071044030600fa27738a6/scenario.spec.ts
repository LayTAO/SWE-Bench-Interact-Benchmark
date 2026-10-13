import {test, expect} from '@playwright/test';

test('portaled input accepts Space and Enter', async ({page}) => {
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('#oracle-ready')).toBeAttached();
  const input = page.getByTestId('portaled-input');
  await expect(input).toBeVisible();
  await input.focus();
  const events = await input.evaluate((element) => [' ', 'Enter'].map((key) => {
    const event = new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true});
    return {key, dispatchResult: element.dispatchEvent(event), defaultPrevented: event.defaultPrevented};
  }));
  expect(events).toEqual([
    {key: ' ', dispatchResult: true, defaultPrevented: false},
    {key: 'Enter', dispatchResult: true, defaultPrevented: false},
  ]);
});
