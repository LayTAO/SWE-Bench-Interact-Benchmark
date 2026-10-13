import fs from 'node:fs'
import { expect, test } from '/tooling/node_modules/playwright/test.mjs'

test('24-hour TimeField accepts a two-digit hour', async ({ page, browserName }) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.message))
  const observation: Record<string, unknown> = { schema_version: '1.0', instance_id: 'unovue__reka-ui-2463', mode: process.env.REPRO_MODE ?? null, browser_name: browserName, workers: 1, retries: 0, environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null }
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const hour = page.getByTestId('hour')
    const value = page.getByTestId('value')
    await expect(hour).toBeVisible()
    await expect(value).toBeVisible()
    await hour.click()
    await hour.press('1')
    await hour.press('4')
    await page.waitForTimeout(100)
    const hourText = (await hour.textContent())?.trim() ?? ''
    const valueText = (await value.textContent())?.trim() ?? ''
    Object.assign(observation, { environment_valid: consoleErrors.length === 0 && pageErrors.length === 0, rendering_valid: true, trigger_valid: hourText.length > 0 && valueText.length > 0, bug_observed: hourText !== '14' || !valueText.startsWith('14:30:00'), hour: hourText, value: valueText })
  } catch (error) {
    observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }
  Object.assign(observation, { console_errors: consoleErrors, page_errors: pageErrors })
  fs.mkdirSync('/results', { recursive: true })
  fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  expect(observation.action_error).toBeNull()
  expect(observation.environment_valid).toBe(true)
  expect(observation.rendering_valid).toBe(true)
  expect(observation.trigger_valid).toBe(true)
  expect(observation.bug_observed).toBe(expectedBug)
})
