import fs from 'node:fs'
import { expect, test } from '/tooling/node_modules/playwright/test.mjs'

test('dialog reopens with the first tabbable input focused', async ({ page, browserName }) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'unovue__reka-ui-2506', mode: process.env.REPRO_MODE ?? null,
    browser_name: browserName, workers: 1, retries: 0, environment_valid: false, rendering_valid: false,
    trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const open = page.getByTestId('open-dialog')
    const input = page.getByTestId('email-input')
    await expect(open).toBeVisible()
    await open.click()
    await expect(input).toBeVisible()
    const focusedOnInitialOpen = await input.evaluate(element => document.activeElement === element)
    await page.keyboard.press('Escape')
    await expect(input).toBeHidden()
    await open.click()
    const activeAfterReopen = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? null)
    Object.assign(observation, {
      environment_valid: consoleErrors.length === 0 && pageErrors.length === 0,
      rendering_valid: await input.isVisible(), trigger_valid: true,
      bug_observed: activeAfterReopen !== 'email-input', active_after_reopen: activeAfterReopen,
      focused_on_initial_open: focusedOnInitialOpen,
    })
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
