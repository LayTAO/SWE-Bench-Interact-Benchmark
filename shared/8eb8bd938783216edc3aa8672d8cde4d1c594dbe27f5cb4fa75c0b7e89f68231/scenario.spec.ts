import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('closing a nested menu preserves the open dialog body pointer lock', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'unovue__reka-ui-2674', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.getByTestId('dialog-trigger').click()
    const dialog = page.getByTestId('dialog-content')
    const overlay = page.getByTestId('dialog-overlay')
    await expect(dialog).toBeVisible()
    const beforeMenu = await page.evaluate(() => document.body.style.pointerEvents)
    await page.getByTestId('menu-trigger').click()
    const menu = page.getByTestId('menu-content')
    await expect(menu).toBeVisible()
    const dialogRect = await dialog.boundingBox()
    const menuRect = await menu.boundingBox()
    const overlayRect = await overlay.boundingBox()
    if (!dialogRect || !menuRect || !overlayRect) throw new Error('dialog geometry is unavailable')
    const renderingValid = dialogRect.width >= 360 && dialogRect.height >= 120 && menuRect.width >= 150 && menuRect.height >= 30 && overlayRect.width >= 900 && overlayRect.height >= 560
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await page.waitForTimeout(140)
    const afterMenu = await page.evaluate(() => document.body.style.pointerEvents)
    const dialogVisible = await dialog.isVisible()
    const oraclePassed = beforeMenu === 'none' && afterMenu === 'none' && dialogVisible
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0 && consoleErrors.length === 0,
      rendering_valid: renderingValid,
      trigger_valid: beforeMenu === 'none',
      bug_observed: !oraclePassed,
      geometry: {dialog: dialogRect, menu: menuRect, overlay: overlayRect},
      body_pointer_events_before_menu: beforeMenu, body_pointer_events_after_menu: afterMenu, dialog_visible_after_menu_close: dialogVisible,
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
