import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('programmatic click through the forwarded MenuButton ref opens the menu', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'tailwindlabs__headlessui-3749', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.locator('#oracle-ready').waitFor({state: 'attached', timeout: 30_000})
    const programmatic = page.getByRole('button', {name: 'Programmatic click'})
    const trigger = page.getByRole('button', {name: 'Trigger'})
    await expect(programmatic).toBeVisible()
    await expect(trigger).toBeVisible()
    const programmaticRect = await programmatic.boundingBox()
    const triggerRect = await trigger.boundingBox()
    if (!programmaticRect || !triggerRect) throw new Error('menu controls have no bounding box')
    const renderingValid = programmaticRect.width >= 40 && triggerRect.width >= 30 && Math.abs(programmaticRect.y - triggerRect.y) <= 8
    await programmatic.click()
    await page.waitForTimeout(250)
    const clickCount = await page.evaluate(() => window.__programmaticClicks ?? 0)
    const menuVisible = await page.getByRole('menu').isVisible().catch(() => false)
    const expanded = await trigger.getAttribute('aria-expanded')
    const items = page.getByRole('menuitem')
    const itemCount = await items.count()
    const visibleItems = menuVisible ? await items.evaluateAll(nodes => nodes.every(node => {
      const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0
    })) : false
    const oraclePassed = menuVisible && expanded === 'true' && itemCount === 3 && visibleItems
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0,
      rendering_valid: renderingValid,
      trigger_valid: clickCount === 1,
      bug_observed: !oraclePassed,
      controls: {programmatic: programmaticRect, trigger: triggerRect},
      menu_visible: menuVisible, aria_expanded: expanded, menu_item_count: itemCount,
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

declare global { interface Window { __programmaticClicks?: number } }
