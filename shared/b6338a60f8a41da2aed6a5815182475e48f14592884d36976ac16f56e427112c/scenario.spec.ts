import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('re-selecting the same DatePicker date does not throw', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'unovue__reka-ui-1618', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.locator('#oracle-ready').waitFor({state: 'attached', timeout: 30_000})
    const baselineTargetErrors = [...consoleErrors, ...pageErrors].filter(message => !message.includes('404'))
    const trigger = page.getByTestId('trigger')
    await expect(trigger).toBeVisible()
    await trigger.click()
    const calendar = page.getByTestId('calendar')
    await calendar.waitFor({state: 'visible'})
    const rendering = await calendar.evaluate(element => {
      const calendarRect = element.getBoundingClientRect()
      const cells = [...element.querySelectorAll('td')].map(cell => cell.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0)
      const rows = [...new Set(cells.map(rect => Math.round(rect.y)))].sort((a, b) => a - b)
      const rowGaps = rows.slice(1).map((value, index) => value - rows[index])
      const centers = new Set(cells.map(rect => `${Math.round(rect.x + rect.width / 2)}:${Math.round(rect.y + rect.height / 2)}`))
      return {
        calendar_rect: {width: calendarRect.width, height: calendarRect.height}, visible_cell_count: cells.length,
        unique_cell_centers: centers.size, visible_row_count: rows.length,
        minimum_row_gap: rowGaps.length ? Math.min(...rowGaps) : 0,
      }
    })
    const renderingValid = rendering.calendar_rect.width >= 200 && rendering.calendar_rect.height >= 180 &&
      rendering.visible_cell_count >= 28 && rendering.unique_cell_centers === rendering.visible_cell_count &&
      rendering.visible_row_count >= 5 && rendering.minimum_row_gap >= 20
    const candidates = page.locator('[data-radix-vue-calendar-cell-trigger]:not([data-outside-view]), [data-reka-calendar-cell-trigger]:not([data-outside-view])')
    const candidateCount = await candidates.count()
    const target = candidates.first()
    await target.click()
    await page.waitForTimeout(150)
    if (!(await calendar.isVisible().catch(() => false))) await trigger.click()
    const selected = page.locator('[data-selected]').first()
    if (await selected.count()) await selected.click(); else await target.click()
    await page.waitForTimeout(250)
    const targetErrors = [...consoleErrors, ...pageErrors].filter(message => !message.includes('404'))
    Object.assign(observation, {
      environment_valid: baselineTargetErrors.length === 0,
      rendering_valid: renderingValid,
      trigger_valid: candidateCount >= 28,
      bug_observed: targetErrors.length > 0,
      rendering, candidate_count: candidateCount, target_error_count: targetErrors.length, target_errors: targetErrors,
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
