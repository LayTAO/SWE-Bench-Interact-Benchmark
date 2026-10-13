import fs from 'node:fs'
import { expect, test } from '/tooling/node_modules/playwright/test.mjs'

test('placeholder follows the active PinInput slot', async ({ page, browserName }) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.message))
  const observation: Record<string, unknown> = { schema_version: '1.0', instance_id: 'unovue__reka-ui-2375', mode: process.env.REPRO_MODE ?? null, browser_name: browserName, workers: 1, retries: 0, environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null }
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const inputs = page.locator('input:not([aria-hidden="true"])')
    await expect(inputs.first()).toBeVisible()
    await inputs.first().click()
    await inputs.first().press('a')
    await page.waitForTimeout(100)
    const placeholders = await inputs.evaluateAll(nodes => nodes.map(node => node.getAttribute('placeholder')))
    Object.assign(observation, { environment_valid: consoleErrors.length === 0 && pageErrors.length === 0, rendering_valid: placeholders.length === 5, trigger_valid: true, bug_observed: placeholders[0] !== '*' || placeholders[1] !== '', placeholders })
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
