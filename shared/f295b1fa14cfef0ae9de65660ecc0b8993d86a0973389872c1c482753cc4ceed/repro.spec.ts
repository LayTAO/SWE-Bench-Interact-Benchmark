import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

test('clicking Select closes an openOnFocus Combobox', async ({ page }) => {
  const consoleErrors: string[] = []
  const notFoundUrls: string[] = []
  page.on('response', (response) => {
    if (response.status() === 404) notFoundUrls.push(response.url())
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
      if (message.text() === 'Failed to load resource: the server responded with a status of 404 (Not Found)' && message.location().url)
        notFoundUrls.push(message.location().url)
    }
  })

  await page.goto('/')
  const comboboxInput = page.getByTestId('combobox-input')
  const comboboxContent = page.getByTestId('combobox-content')
  await comboboxInput.click()
  await expect(comboboxContent).toBeVisible()
  await expect(comboboxInput).toBeFocused()

  await page.getByTestId('select-trigger').click()
  await expect(page.getByTestId('select-content')).toBeVisible()
  await page.waitForTimeout(100)

  const comboboxVisible = await comboboxContent.isVisible().catch(() => false)
  const active = await page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? null,
    text: document.activeElement?.textContent?.trim() ?? null,
    testId: (document.activeElement as HTMLElement | null)?.dataset.testid ?? null,
  }))
  const resultsDir = process.env.RESULTS_DIR ?? '.'
  const faviconOnly404 = notFoundUrls.length > 0 && notFoundUrls.every((url) => new URL(url).pathname === '/favicon.ico')
  const substantiveConsoleErrors = faviconOnly404
    ? consoleErrors.filter((text) => text !== 'Failed to load resource: the server responded with a status of 404 (Not Found)')
    : consoleErrors
  await page.screenshot({ path: `${resultsDir}/screenshot.png`, fullPage: true })
  writeFileSync(`${resultsDir}/observation.json`, `${JSON.stringify({
    schema_version: '1.0',
    mode: process.env.REPRO_MODE ?? 'unknown',
    browser: await page.evaluate(() => navigator.userAgent),
    viewport: await page.viewportSize(),
    precondition: { combobox_open: true, combobox_input_focused: true },
    action: 'click the neighboring Select trigger',
    postcondition: { combobox_open: comboboxVisible, select_open: true, active_element: active },
    oracle: { expected_combobox_open: false, passed: !comboboxVisible },
    console_errors: substantiveConsoleErrors,
    resource_404_urls: notFoundUrls,
    ignored_favicon_404: faviconOnly404,
    used_for_scoring: false,
  }, null, 2)}\n`)
  expect(comboboxVisible).toBe(false)
})
