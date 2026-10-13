import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('DatePicker resets stale time after its model is cleared', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'; const consoleErrors: string[] = []; const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) }); page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, any> = {schema_version: '1.0', instance_id: 'unovue__reka-ui-2599', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null, viewport: page.viewportSize(), workers: 1, retries: 0,
    environment_valid: false, rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null}
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'}); await page.getByRole('button', {name: 'Clear model'}).click(); await page.getByTestId('trigger').click()
    const day = page.locator('[data-reka-calendar-cell-trigger]:not([data-outside-view]):not([data-unavailable]), [data-radix-vue-calendar-cell-trigger]:not([data-outside-view]):not([data-unavailable])').first()
    await expect(day).toBeVisible()
    const geometry = await page.evaluate(() => {
      const card = document.querySelector('.card')!.getBoundingClientRect(); const calendar = document.querySelector('[data-testid="calendar"]')!.getBoundingClientRect(); const header = document.querySelector('[data-testid="header"]')!.getBoundingClientRect(); const grid = document.querySelector('[data-testid^="grid-"]')!.getBoundingClientRect()
      const cells = [...document.querySelectorAll('[data-reka-calendar-cell-trigger], [data-radix-vue-calendar-cell-trigger]')].map(node => node.getBoundingClientRect()).filter(box => box.width > 0 && box.height > 0)
      return {card: {width: card.width, height: card.height}, calendar: {x: calendar.x, y: calendar.y, width: calendar.width, height: calendar.height, right: calendar.right}, headerBottom: header.bottom, gridTop: grid.top,
        cellCount: cells.length, uniqueCellCenters: new Set(cells.map(box => `${Math.round(box.x + box.width / 2)}:${Math.round(box.y + box.height / 2)}`)).size,
        minCellWidth: cells.length ? Math.min(...cells.map(box => box.width)) : 0, minCellHeight: cells.length ? Math.min(...cells.map(box => box.height)) : 0}
    })
    await day.click(); await page.waitForTimeout(250); const selected = await page.evaluate(() => window.__lastValue ?? null)
    const zeroTime = Boolean(selected) && selected.hour === 0 && selected.minute === 0 && selected.second === 0 && selected.millisecond === 0
    Object.assign(observation, {environment_valid: pageErrors.length === 0 && consoleErrors.length === 0,
      rendering_valid: geometry.card.width >= 500 && geometry.card.height >= 180 && geometry.calendar.width >= 280 && geometry.calendar.height >= 280 && geometry.calendar.x >= 0 && geometry.calendar.right <= 960 && geometry.headerBottom <= geometry.gridTop && geometry.cellCount >= 28 && geometry.uniqueCellCenters === geometry.cellCount && geometry.minCellWidth >= 30 && geometry.minCellHeight >= 30,
      trigger_valid: Boolean(selected), bug_observed: Boolean(selected) && !zeroTime, geometry, selected_value: selected})
  } catch (error) { observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error) }
  Object.assign(observation, {console_errors: consoleErrors, page_errors: pageErrors}); fs.mkdirSync('/results', {recursive: true}); fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  await page.screenshot({path: `/results/${process.env.REPRO_MODE}-screenshot.png`, fullPage: true}).catch(() => {})
  expect(observation.action_error).toBeNull(); expect(observation.environment_valid).toBe(true); expect(observation.rendering_valid).toBe(true); expect(observation.trigger_valid).toBe(true); expect(observation.bug_observed).toBe(expectedBug)
})
