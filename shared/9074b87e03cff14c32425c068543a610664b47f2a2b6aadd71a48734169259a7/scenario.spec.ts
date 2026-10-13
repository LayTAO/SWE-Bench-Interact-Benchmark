import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('Autocomplete defers filtering and model updates during IME composition', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []; const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) }); page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, any> = {schema_version: '1.0', instance_id: 'unovue__reka-ui-2540', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null, viewport: page.viewportSize(), workers: 1, retries: 0,
    environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null}
  try {
    // The story's decorative chevron is loaded through Iconify's CDN. Keep it
    // deterministic offline without changing the Autocomplete under test.
    await page.route(/^https:\/\/api\.(?:iconify\.design|simplesvg\.com|unisvg\.com)\/radix-icons\.json\?icons=chevron-down$/, route => route.fulfill({
      contentType: 'application/json',
      headers: {'access-control-allow-origin': '*'},
      body: JSON.stringify({prefix: 'radix-icons', width: 15, height: 15,
        icons: {'chevron-down': {body: '<path d="m4.5 6 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'}}}),
    }))
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.locator('.demo button').first().click()
    const input = page.locator('.demo input').first(); await expect(input).toBeVisible(); await input.focus()
    const optionsBefore = page.getByRole('option'); await expect(optionsBefore.first()).toBeVisible()
    const geometry = await page.evaluate(() => {
      const card = document.querySelector('.card')!.getBoundingClientRect(); const input = document.querySelector('.demo input')!.getBoundingClientRect()
      const options = [...document.querySelectorAll('[role="option"]')].map(node => node.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0)
      return {card: {width: card.width, height: card.height}, input: {width: input.width, height: input.height}, optionCount: options.length,
        uniqueOptionCenters: new Set(options.map(box => `${Math.round(box.x + box.width / 2)}:${Math.round(box.y + box.height / 2)}`)).size}
    })
    await input.evaluate(element => {
      element.dispatchEvent(new CompositionEvent('compositionstart', {bubbles: true, data: ''})); (element as HTMLInputElement).value = 'zzzzz'
      element.dispatchEvent(new InputEvent('input', {bubbles: true, data: 'zzzzz', inputType: 'insertCompositionText', isComposing: true}))
    })
    await page.waitForTimeout(150)
    const visibleDuring = await page.getByRole('option').count(); const emptyDuring = await page.getByRole('listbox').getAttribute('data-empty')
    const updatesDuring = await page.evaluate(() => window.__updates?.length ?? 0)
    await input.evaluate(element => { (element as HTMLInputElement).value = '香'; element.dispatchEvent(new CompositionEvent('compositionend', {bubbles: true, data: '香'})) })
    await page.waitForTimeout(150)
    const updatesAfter = await page.evaluate(() => window.__updates ?? [])
    const fixedState = visibleDuring > 0 && emptyDuring === null && updatesDuring === 0 && updatesAfter.length > 0
    Object.assign(observation, {environment_valid: pageErrors.length === 0 && consoleErrors.length === 0,
      rendering_valid: geometry.card.width >= 500 && geometry.card.height >= 180 && geometry.input.width >= 120 && geometry.input.height >= 32 && geometry.optionCount >= 2 && geometry.uniqueOptionCenters === geometry.optionCount,
      trigger_valid: geometry.optionCount > 0, bug_observed: !fixedState, geometry, visible_options_during_composition: visibleDuring,
      data_empty_during_composition: emptyDuring, update_count_during_composition: updatesDuring, updates_after_composition: updatesAfter})
  } catch (error) { observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error) }
  Object.assign(observation, {console_errors: consoleErrors, page_errors: pageErrors}); fs.mkdirSync('/results', {recursive: true}); fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  await page.screenshot({path: `/results/${process.env.REPRO_MODE}-screenshot.png`, fullPage: true}).catch(() => {})
  expect(observation.action_error).toBeNull(); expect(observation.environment_valid).toBe(true); expect(observation.rendering_valid).toBe(true); expect(observation.trigger_valid).toBe(true); expect(observation.bug_observed).toBe(expectedBug)
})
