import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

test('hovering a submenu trigger highlights it immediately', async ({ page }) => {
  const consoleErrors: string[] = []
  const notFoundUrls: string[] = []
  page.on('response', response => { if (response.status() === 404) notFoundUrls.push(response.url()) })
  page.on('console', m => {
    if (m.type() === 'error') {
      consoleErrors.push(m.text())
      if (m.text() === 'Failed to load resource: the server responded with a status of 404 (Not Found)' && m.location().url)
        notFoundUrls.push(m.location().url)
    }
  })
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
  const faviconOnly404 = notFoundUrls.length > 0 && notFoundUrls.every(url => new URL(url).pathname === '/favicon.ico')
  const substantiveConsoleErrors = faviconOnly404
    ? consoleErrors.filter(text => text !== 'Failed to load resource: the server responded with a status of 404 (Not Found)')
    : consoleErrors
  await page.screenshot({ path: `${resultsDir}/screenshot.png`, fullPage: true })
  writeFileSync(`${resultsDir}/observation.json`, `${JSON.stringify({
    schema_version: '1.0', mode: process.env.REPRO_MODE ?? 'unknown',
    browser: await page.evaluate(() => navigator.userAgent), viewport: await page.viewportSize(),
    precondition: { menu_open: true, highlighted_before_hover: before !== null },
    action: 'move the pointer over the submenu trigger',
    postcondition: { trigger_highlighted: highlighted, submenu_visible: submenuVisible },
    oracle: { expected_trigger_highlighted: true, passed: highlighted },
    console_errors: substantiveConsoleErrors, resource_404_urls: notFoundUrls,
    ignored_favicon_404: faviconOnly404, used_for_scoring: false,
  }, null, 2)}
`)
  expect(highlighted).toBe(true)
})
