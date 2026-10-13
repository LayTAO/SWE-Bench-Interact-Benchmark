import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

test('a Combobox input portaled from a Dialog can retain focus and receive typing', async ({ page }) => {
  const consoleErrors: string[] = []
  const resource404Urls: string[] = []
  page.on('response', response => { if (response.status() === 404) resource404Urls.push(response.url()) })
  page.on('console', m => {
    if (m.type() !== 'error') return
    const url = m.location().url
    if (m.text().includes('404') && url && new URL(url).pathname === '/favicon.ico') return
    consoleErrors.push(m.text())
  })
  await page.goto('/')
  await page.getByTestId('dialog-trigger').click()
  await page.getByTestId('combobox-trigger').click()
  const input = page.getByTestId('combobox-input')
  await expect(input).toBeVisible()
  await page.waitForTimeout(100)
  const focusedAfterOpen = await input.evaluate(el => el === document.activeElement)
  await page.keyboard.type('Svelte')
  await page.waitForTimeout(100)
  const state = await page.evaluate(() => ({
    active_test_id: (document.activeElement as HTMLElement | null)?.dataset.testid ?? null,
    input_value: (document.querySelector('[data-testid="combobox-input"]') as HTMLInputElement | null)?.value ?? null,
  }))
  const passed = focusedAfterOpen && state.active_test_id === 'combobox-input' && state.input_value === 'Svelte'
  const resultsDir = process.env.RESULTS_DIR ?? '.'
  await page.screenshot({ path: `${resultsDir}/screenshot.png`, fullPage: true })
  writeFileSync(`${resultsDir}/observation.json`, `${JSON.stringify({
    schema_version: '1.0', mode: process.env.REPRO_MODE ?? 'unknown',
    browser: await page.evaluate(() => navigator.userAgent), viewport: await page.viewportSize(),
    precondition: { dialog_open: true, combobox_open: true, input_focused_after_open: focusedAfterOpen },
    action: 'type Svelte into the portaled Combobox input', postcondition: state,
    oracle: { expected_active_test_id: 'combobox-input', expected_input_value: 'Svelte', passed },
    console_errors: consoleErrors, resource_404_urls: resource404Urls,
    ignored_favicon_404: resource404Urls.length > 0 && resource404Urls.every(url => new URL(url).pathname === '/favicon.ico'),
    used_for_scoring: false,
  }, null, 2)}
`)
  expect(passed).toBe(true)
})
