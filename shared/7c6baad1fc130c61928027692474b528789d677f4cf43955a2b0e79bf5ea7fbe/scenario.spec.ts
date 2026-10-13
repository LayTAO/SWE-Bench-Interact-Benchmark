import fs from 'node:fs'
import { expect, test } from '/tooling/node_modules/playwright/test.mjs'

test('selected RangeCalendar cells use button-compatible ARIA', async ({ page, browserName }) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.message))
  const observation: Record<string, unknown> = { schema_version: '1.0', instance_id: 'unovue__reka-ui-2261', mode: process.env.REPRO_MODE ?? null, browser_name: browserName, workers: 1, retries: 0, environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null }
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const selected = page.locator('[data-reka-calendar-cell-trigger][data-selected="true"]')
    await expect(selected.first()).toBeVisible()
    const attrs = await selected.evaluateAll(nodes => nodes.map(node => ({ role: node.getAttribute('role'), ariaSelected: node.getAttribute('aria-selected'), ariaPressed: node.getAttribute('aria-pressed') })))
    const hasValidSelectedButton = attrs.length > 0 && attrs.every(item => item.role === 'button')
    const bugObserved = attrs.some(item => item.ariaSelected === 'true' || item.ariaPressed !== 'true')
    Object.assign(observation, { environment_valid: consoleErrors.length === 0 && pageErrors.length === 0, rendering_valid: attrs.length > 0, trigger_valid: hasValidSelectedButton, bug_observed: bugObserved, selected: attrs })
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
