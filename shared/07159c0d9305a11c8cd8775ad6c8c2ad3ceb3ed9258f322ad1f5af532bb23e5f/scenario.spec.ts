import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('external focus requests always focus VAutocomplete', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'vuetifyjs__vuetify-11989', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.locator('#oracle-ready').waitFor({state: 'attached', timeout: 30_000})
    const button = page.getByTestId('focus-button')
    const input = page.getByRole('textbox', {name: 'Choice'})
    await expect(button).toBeVisible()
    await expect(input).toBeVisible()
    const buttonRect = await button.boundingBox()
    const inputRect = await input.boundingBox()
    if (!buttonRect || !inputRect) throw new Error('controls have no bounding box')
    const renderingValid = buttonRect.width >= 120 && buttonRect.height >= 30 &&
      inputRect.width >= 200 && inputRect.height >= 20 && buttonRect.y < inputRect.y

    const focusedAfterClicks: boolean[] = []
    for (let index = 0; index < 4; index += 1) {
      await button.click()
      await page.waitForTimeout(100)
      focusedAfterClicks.push(await input.evaluate(element => document.activeElement === element))
    }
    const triggerValid = focusedAfterClicks.length === 4 && focusedAfterClicks[0] === true
    const oraclePassed = triggerValid && focusedAfterClicks.every(Boolean)
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0,
      rendering_valid: renderingValid,
      trigger_valid: triggerValid,
      bug_observed: !oraclePassed,
      focused_after_clicks: focusedAfterClicks,
      controls: {button: buttonRect, input: inputRect},
    })
  } catch (error) {
    observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }
  Object.assign(observation, {console_errors: consoleErrors, page_errors: pageErrors})
  fs.mkdirSync('/results', {recursive: true})
  fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  await page.screenshot({path: `/results/${process.env.REPRO_MODE}-screenshot.png`, fullPage: true}).catch(() => {})
  expect(observation.action_error).toBeNull()
  expect(observation.environment_valid).toBe(true)
  expect(observation.rendering_valid).toBe(true)
  expect(observation.trigger_valid).toBe(true)
  expect(observation.bug_observed).toBe(expectedBug)
})
