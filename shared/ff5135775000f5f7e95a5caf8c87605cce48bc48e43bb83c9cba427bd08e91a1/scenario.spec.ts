import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('Tab exits an open non-modal menu', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'unovue__reka-ui-2296', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    const trigger = page.getByTestId('trigger')
    const item = page.getByTestId('item')
    const afterButton = page.getByTestId('after')
    const output = page.getByTestId('active')
    await expect(trigger).toBeVisible()
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(item).toBeVisible()
    await item.focus()
    await expect(item).toBeFocused()
    const triggerRect = await trigger.boundingBox()
    const itemRect = await item.boundingBox()
    const afterRect = await afterButton.boundingBox()
    const outputRect = await output.boundingBox()
    if (!triggerRect || !itemRect || !afterRect || !outputRect) throw new Error('menu controls have no bounding box')
    const renderingValid = triggerRect.width >= 70 && itemRect.width >= 100 && itemRect.height >= 30 && afterRect.width >= 50 && outputRect.y >= itemRect.y + itemRect.height + 12
    const before = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid ?? null)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(120)
    const after = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid ?? null)
    const menuVisible = await page.getByTestId('menu').isVisible().catch(() => false)
    const oraclePassed = after === 'after' && !menuVisible
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0 && consoleErrors.length === 0,
      rendering_valid: renderingValid,
      trigger_valid: before === 'item',
      bug_observed: !oraclePassed,
      controls: {trigger: triggerRect, item: itemRect, after: afterRect, output: outputRect},
      active_before_tab: before, active_after_tab: after, menu_visible_after_tab: menuVisible,
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
