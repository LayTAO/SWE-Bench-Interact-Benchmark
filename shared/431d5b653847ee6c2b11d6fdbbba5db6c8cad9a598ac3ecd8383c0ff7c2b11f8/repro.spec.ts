import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

test('pointerdown on a native select inside nested Dialog content keeps its default action', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  await page.goto('/')
  await page.getByTestId('dialog-trigger').click()
  await expect(page.getByTestId('dialog-content')).toBeVisible()
  await page.evaluate(() => {
    ;(window as any).__pointerPrevented = null
    document.addEventListener('pointerdown', event => {
      ;(window as any).__pointerPrevented = event.defaultPrevented
    }, { once: true })
  })
  await page.getByTestId('native-select').click()
  await page.waitForTimeout(100)
  const state = await page.evaluate(() => ({
    pointer_default_prevented: (window as any).__pointerPrevented,
    active_test_id: (document.activeElement as HTMLElement | null)?.dataset.testid ?? null,
  }))
  const dialogVisible = await page.getByTestId('dialog-content').isVisible()
  const passed = state.pointer_default_prevented === false && state.active_test_id === 'native-select' && dialogVisible
  const resultsDir = process.env.RESULTS_DIR ?? '.'
  await page.screenshot({ path: `${resultsDir}/screenshot.png`, fullPage: true })
  writeFileSync(`${resultsDir}/observation.json`, `${JSON.stringify({
    schema_version: '1.0', mode: process.env.REPRO_MODE ?? 'unknown',
    browser: await page.evaluate(() => navigator.userAgent), viewport: await page.viewportSize(),
    precondition: { dialog_open: true, select_inside_overlay: true }, action: 'click the native select',
    postcondition: { ...state, dialog_open: dialogVisible },
    oracle: { expected_pointer_default_prevented: false, expected_active_test_id: 'native-select', passed },
    console_errors: consoleErrors, used_for_scoring: false,
  }, null, 2)}
`)
  expect(passed).toBe(true)
})
