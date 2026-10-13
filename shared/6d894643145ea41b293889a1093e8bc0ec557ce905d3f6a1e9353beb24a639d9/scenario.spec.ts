import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('ListboxItem reflects reactive disabled changes in DOM attributes', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'; const consoleErrors: string[] = []; const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) }); page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, any> = {schema_version: '1.0', instance_id: 'unovue__reka-ui-2644', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null, viewport: page.viewportSize(), workers: 1, retries: 0,
    environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null}
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'}); const item = page.getByRole('option').first(); await expect(item).toBeVisible()
    const geometry = await page.evaluate(() => { const card = document.querySelector('.card')!.getBoundingClientRect(); const options = [...document.querySelectorAll('[role="option"]')].map(node => node.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0); return {card: {width: card.width, height: card.height}, optionCount: options.length, uniqueOptionCenters: new Set(options.map(box => `${Math.round(box.x + box.width / 2)}:${Math.round(box.y + box.height / 2)}`)).size, minOptionHeight: Math.min(...options.map(box => box.height))} })
    const attributes = async () => ({dataDisabled: await item.getAttribute('data-disabled'), disabled: await item.getAttribute('disabled')})
    const before = await attributes(); await page.getByRole('button', {name: /Toggle disabled/}).click(); await page.waitForTimeout(100); const enabledToDisabled = await attributes()
    await page.getByRole('button', {name: /Toggle disabled/}).click(); await page.waitForTimeout(100); const disabledToEnabled = await attributes()
    const fixedState = enabledToDisabled.dataDisabled !== null && enabledToDisabled.disabled !== null && disabledToEnabled.dataDisabled === null && disabledToEnabled.disabled === null
    Object.assign(observation, {environment_valid: pageErrors.length === 0 && consoleErrors.length === 0,
      rendering_valid: geometry.card.width >= 500 && geometry.card.height >= 180 && geometry.optionCount === 2 && geometry.uniqueOptionCenters === 2 && geometry.minOptionHeight >= 32,
      trigger_valid: before.dataDisabled === null && before.disabled === null, bug_observed: !fixedState, geometry, before, enabled_to_disabled: enabledToDisabled, disabled_to_enabled: disabledToEnabled})
  } catch (error) { observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error) }
  Object.assign(observation, {console_errors: consoleErrors, page_errors: pageErrors}); fs.mkdirSync('/results', {recursive: true}); fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  await page.screenshot({path: `/results/${process.env.REPRO_MODE}-screenshot.png`, fullPage: true}).catch(() => {})
  expect(observation.action_error).toBeNull(); expect(observation.environment_valid).toBe(true); expect(observation.rendering_valid).toBe(true); expect(observation.trigger_valid).toBe(true); expect(observation.bug_observed).toBe(expectedBug)
})
