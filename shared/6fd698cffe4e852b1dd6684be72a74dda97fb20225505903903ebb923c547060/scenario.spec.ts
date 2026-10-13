import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/playwright/test.mjs'

test('two zero presses advance focus from hour to minute in a 12-hour locale', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'unovue__reka-ui-2580', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    const hour = page.getByTestId('hour')
    await expect(hour).toBeVisible()
    const geometry = await page.locator('.segments').evaluate(element => {
      const root = element.getBoundingClientRect()
      const segments = [...element.querySelectorAll('.segment')].map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0)
      return {root: {width: root.width, height: root.height}, count: segments.length, centers: new Set(segments.map(rect => `${Math.round(rect.x + rect.width / 2)}:${Math.round(rect.y + rect.height / 2)}`)).size, minHeight: Math.min(...segments.map(rect => rect.height))}
    })
    const renderingValid = geometry.root.width >= 160 && geometry.root.height >= 40 && geometry.count >= 4 && geometry.centers === geometry.count && geometry.minHeight >= 20
    await hour.click()
    await page.keyboard.press('0')
    const afterFirst = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.rekaTimeFieldSegment ?? null)
    await page.keyboard.press('0')
    await page.waitForTimeout(120)
    const afterSecond = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.rekaTimeFieldSegment ?? null)
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0 && consoleErrors.length === 0,
      rendering_valid: renderingValid,
      trigger_valid: afterFirst === 'hour',
      bug_observed: afterSecond !== 'minute',
      geometry, active_after_first_zero: afterFirst, active_after_second_zero: afterSecond,
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
