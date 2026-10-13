import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/@playwright/test/index.js'

test('outside pointer release must not select an item from the restored menu', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))

  const observation: Record<string, unknown> = {
    schema_version: '1.0',
    instance_id: 'adobe__react-spectrum-2181',
    mode: process.env.REPRO_MODE,
    expected_bug: expectedBug,
    browser_name: browserName,
    browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(),
    workers: 1,
    retries: 0,
    environment_valid: false,
    trigger_valid: false,
    bug_observed: false,
    action_error: null,
  }

  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.locator('#oracle-ready').waitFor({state: 'attached', timeout: 30_000})

    const input = page.getByRole('combobox')
    await expect(input).toBeVisible()
    const trigger = page.getByRole('button').first()
    const inputRect = await input.boundingBox()
    const triggerRect = await trigger.boundingBox()
    if (!inputRect || !triggerRect) throw new Error('ComboBox controls have no bounding box')
    await trigger.click()
    const initialListbox = page.getByRole('listbox')
    await expect(initialListbox).toBeVisible()
    await expect(page.getByRole('option')).toHaveCount(9)
    const initialRect = await initialListbox.boundingBox()
    if (!initialRect) throw new Error('initial listbox has no bounding box')
    const initialLayoutValid =
      inputRect.width >= 120 &&
      inputRect.width <= 360 &&
      inputRect.height >= 24 &&
      inputRect.height <= 64 &&
      triggerRect.width >= 20 &&
      triggerRect.width <= 64 &&
      Math.abs(triggerRect.y - inputRect.y) <= 4 &&
      Math.abs(triggerRect.height - inputRect.height) <= 4 &&
      triggerRect.x >= inputRect.x + inputRect.width - 4 &&
      triggerRect.x <= inputRect.x + inputRect.width + 8 &&
      Math.abs(initialRect.x - inputRect.x) <= 12 &&
      Math.abs(initialRect.width - (inputRect.width + triggerRect.width)) <= 20 &&
      initialRect.height >= 180 &&
      initialRect.height <= 400 &&
      initialRect.y >= inputRect.y + inputRect.height - 4 &&
      initialRect.y <= inputRect.y + inputRect.height + 24

    await input.fill('Nuclear')
    await expect(input).toHaveValue('Nuclear')
    await expect(page.getByRole('option')).toHaveCount(1)
    const filteredListbox = page.getByRole('listbox')
    const filteredRect = await filteredListbox.boundingBox()
    if (!filteredRect) throw new Error('filtered listbox has no bounding box')

    const clickX = filteredRect.x + Math.min(80, filteredRect.width / 2)
    const clickY = Math.min(
      initialRect.y + initialRect.height - 12,
      filteredRect.y + filteredRect.height + 32,
    )
    const clickIsOutsideFiltered = clickY > filteredRect.y + filteredRect.height + 2
    const clickIsInsideInitial = clickY < initialRect.y + initialRect.height
    const filteredLayoutValid =
      Math.abs(filteredRect.x - initialRect.x) <= 4 &&
      Math.abs(filteredRect.width - initialRect.width) <= 4 &&
      filteredRect.height >= 24 &&
      filteredRect.height < initialRect.height
    if (!initialLayoutValid || !filteredLayoutValid) {
      throw new Error('ComboBox layout does not match the repository-native geometry')
    }
    if (!clickIsOutsideFiltered || !clickIsInsideInitial) {
      throw new Error('no valid stale menu area is available')
    }

    await page.mouse.move(clickX, clickY)
    await page.mouse.down()
    await expect(input).toHaveValue('')
    const during = {
      input_value: await input.inputValue(),
      visible_option_count: await page.getByRole('option').count(),
      listbox_visible: await page.getByRole('listbox').isVisible().catch(() => false),
    }

    await page.mouse.up()
    await expect.poll(() => input.getAttribute('aria-expanded')).not.toBe('true')
    await expect(page.getByRole('listbox')).toBeHidden()
    const selections = await page.evaluate(() => window.__interactRepairSelections ?? [])
    const after = {
      input_value: await input.inputValue(),
      selections,
      aria_expanded: await input.getAttribute('aria-expanded'),
      listbox_visible: await page.getByRole('listbox').isVisible().catch(() => false),
    }

    const environmentValid = pageErrors.length === 0
    const triggerValid =
      initialRect.height > filteredRect.height &&
      initialLayoutValid &&
      filteredLayoutValid &&
      clickIsOutsideFiltered &&
      clickIsInsideInitial &&
      during.input_value === '' &&
      after.aria_expanded !== 'true' &&
      !after.listbox_visible
    const bugObserved = triggerValid && selections.length > 0
    Object.assign(observation, {
      environment_valid: environmentValid,
      trigger_valid: triggerValid,
      bug_observed: bugObserved,
      layout: {input: inputRect, trigger: triggerRect, initial_valid: initialLayoutValid, filtered_valid: filteredLayoutValid},
      initial: {rect: initialRect, option_count: 9},
      filtered: {rect: filteredRect, option_count: 1},
      stale_click: {x: clickX, y: clickY},
      during,
      after,
    })
  } catch (error) {
    observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }

  Object.assign(observation, {console_errors: consoleErrors, page_errors: pageErrors})
  fs.mkdirSync('/results', {recursive: true})
  fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)

  expect(observation.action_error).toBeNull()
  expect(observation.environment_valid).toBe(true)
  expect(observation.trigger_valid).toBe(true)
  expect(observation.bug_observed).toBe(expectedBug)
})

declare global {
  interface Window {
    __interactRepairSelections?: unknown[]
  }
}
