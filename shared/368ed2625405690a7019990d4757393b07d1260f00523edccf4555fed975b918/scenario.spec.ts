import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('clicking the MultiSelect textbox opens its listbox exactly once', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'sage__carbon-6841', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.locator('#oracle-ready').waitFor({state: 'attached', timeout: 30_000})
    const input = page.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
    const inputRect = await input.boundingBox()
    if (!inputRect) throw new Error('MultiSelect textbox has no bounding box')
    const presentation = page.locator('[role="presentation"]').first()
    await expect(presentation).toBeVisible()
    const presentationRect = await presentation.boundingBox()
    if (!presentationRect) throw new Error('MultiSelect presentation has no bounding box')
    const presentationStyle = await presentation.evaluate(element => {
      const style = getComputedStyle(element)
      return {borderTopWidth: style.borderTopWidth, minHeight: style.minHeight, backgroundColor: style.backgroundColor}
    })
    const renderingValid = presentationRect.width >= 120 && presentationRect.width <= 420 && presentationRect.height >= 32 && presentationRect.height <= 72 && presentationStyle.borderTopWidth === '1px'
    await input.click()
    await page.waitForTimeout(350)
    const focused = await input.evaluate(element => document.activeElement === element)
    const listboxVisible = await page.getByRole('listbox').isVisible().catch(() => false)
    const optionCount = await page.getByRole('option').count()
    const onOpenCount = await page.evaluate(() => window.__openCount ?? 0)
    const oraclePassed = listboxVisible && optionCount === 3 && onOpenCount === 1
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0,
      rendering_valid: renderingValid,
      trigger_valid: focused,
      bug_observed: !oraclePassed,
      input_rect: inputRect,
      presentation_rect: presentationRect,
      presentation_style: presentationStyle,
      listbox_visible_after_textbox_click: listboxVisible,
      option_count: optionCount,
      on_open_count: onOpenCount,
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

declare global { interface Window { __openCount?: number } }
