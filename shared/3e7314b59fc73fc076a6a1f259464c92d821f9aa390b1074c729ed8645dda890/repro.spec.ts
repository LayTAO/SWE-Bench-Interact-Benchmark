import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

test('hovering a submenu trigger highlights it immediately', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  await page.goto('/')
  await page.getByTestId('trigger').click()
  const subTrigger = page.getByTestId('sub-trigger')
  await expect(subTrigger).toBeVisible()
  const before = await subTrigger.getAttribute('data-highlighted')
  await subTrigger.hover()
  await page.waitForTimeout(120)
  const highlighted = await subTrigger.getAttribute('data-highlighted') !== null
  const submenuVisible = await page.getByTestId('sub-content').isVisible().catch(() => false)
  const resultsDir = process.env.RESULTS_DIR ?? '.'
  await page.screenshot({ path: `${resultsDir}/screenshot.png`, fullPage: true })
  writeFileSync(`${resultsDir}/observation.json`, `${JSON.stringify({
    schema_version: '1.0', mode: process.env.REPRO_MODE ?? 'unknown',
    browser: await page.evaluate(() => navigator.userAgent), viewport: await page.viewportSize(),
    precondition: { menu_open: true, highlighted_before_hover: before !== null },
    action: 'move the pointer over the submenu trigger',
    postcondition: { trigger_highlighted: highlighted, submenu_visible: submenuVisible },
    oracle: { expected_trigger_highlighted: true, passed: highlighted },
    console_errors: consoleErrors, used_for_scoring: false,
  }, null, 2)}
`)
  expect(highlighted).toBe(true)
})
