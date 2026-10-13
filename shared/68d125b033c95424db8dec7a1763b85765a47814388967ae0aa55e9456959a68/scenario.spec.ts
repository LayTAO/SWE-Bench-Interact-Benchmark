import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('selecting a matching Combobox option commits the option and refocuses the tags input', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, any> = {schema_version: '1.0', instance_id: 'unovue__reka-ui-2259', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null, viewport: page.viewportSize(), workers: 1, retries: 0,
    environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null}
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    const input = page.locator('input').first()
    await expect(input).toBeVisible()
    await input.fill('a')
    const apple = page.getByRole('option', {name: 'Apple', exact: true})
    await expect(apple).toBeVisible()
    const geometry = await page.evaluate(() => {
      const card = document.querySelector('.card')!.getBoundingClientRect()
      const input = document.querySelector('input')!.getBoundingClientRect()
      const options = [...document.querySelectorAll('[role="option"]')].map(node => node.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0)
      return {card: {width: card.width, height: card.height}, input: {width: input.width, height: input.height}, optionCount: options.length,
        uniqueOptionCenters: new Set(options.map(box => `${Math.round(box.x + box.width / 2)}:${Math.round(box.y + box.height / 2)}`)).size,
        minOptionHeight: options.length ? Math.min(...options.map(box => box.height)) : 0}
    })
    const inputBefore = await input.inputValue()
    await apple.click()
    await page.waitForTimeout(180)
    const collectionTexts = (await page.locator('[data-reka-collection-item]').allTextContents()).map(text => text.trim()).filter(Boolean)
    const activeIsInput = await input.evaluate(element => document.activeElement === element)
    const fixedState = collectionTexts.includes('Apple') && !collectionTexts.includes('a') && activeIsInput
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0 && consoleErrors.length === 0,
      rendering_valid: geometry.card.width >= 500 && geometry.card.height >= 180 && geometry.input.width >= 120 && geometry.input.height >= 32 && geometry.optionCount >= 2 && geometry.uniqueOptionCenters === geometry.optionCount && geometry.minOptionHeight >= 24,
      trigger_valid: inputBefore === 'a', bug_observed: !fixedState, geometry, input_value_before_selection: inputBefore,
      collection_item_texts: collectionTexts, active_element_is_input: activeIsInput,
    })
  } catch (error) { observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error) }
  Object.assign(observation, {console_errors: consoleErrors, page_errors: pageErrors})
  fs.mkdirSync('/results', {recursive: true}); fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  await page.screenshot({path: `/results/${process.env.REPRO_MODE}-screenshot.png`, fullPage: true}).catch(() => {})
  expect(observation.action_error).toBeNull(); expect(observation.environment_valid).toBe(true); expect(observation.rendering_valid).toBe(true); expect(observation.trigger_valid).toBe(true); expect(observation.bug_observed).toBe(expectedBug)
})
