import fs from 'node:fs'
import {expect, test} from '/tooling/node_modules/@playwright/test/index.js'

test('ComboBox closes when the ModalOverlay is clicked', async ({page, browserName}) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'adobe__react-spectrum-5338',
    mode: process.env.REPRO_MODE, expected_bug: expectedBug, browser_name: browserName,
    browser_version: page.context().browser()?.version() ?? null, viewport: page.viewportSize(),
    workers: 1, retries: 0, environment_valid: false, trigger_valid: false,
    bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', {waitUntil: 'domcontentloaded'})
    await page.getByTestId('oracle-ready').waitFor({state: 'attached'})
    const openButton = page.getByTestId('open-dialog')
    await expect(openButton).toBeVisible()
    await openButton.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const comboInput = page.getByTestId('combobox-input')
    const comboButton = page.getByTestId('combobox-button')
    await expect(comboInput).toBeVisible()
    await expect(comboButton).toBeVisible()
    const overlay = page.getByTestId('modal-overlay')
    const overlayBox = await overlay.boundingBox()
    const modalBox = await page.locator('.react-aria-Modal').boundingBox()
    const inputBox = await comboInput.boundingBox()
    const buttonBox = await comboButton.boundingBox()
    if (!overlayBox || !modalBox || !inputBox || !buttonBox) throw new Error('required UI geometry is unavailable')
    const geometryValid = overlayBox.width >= 600 && overlayBox.height >= 400 && modalBox.width >= 240 && modalBox.height >= 120 && inputBox.width >= 120 && inputBox.height >= 20 && buttonBox.width >= 20
    if (!geometryValid) throw new Error('rendering fidelity gate failed')
    await comboInput.click()
    await comboInput.press('ArrowDown')
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()
    await expect(page.getByRole('option')).toHaveCount(6)
    const listboxBox = await listbox.boundingBox()
    if (!listboxBox) throw new Error('listbox geometry is unavailable')
    const clickX = overlayBox.x + 12
    const clickY = overlayBox.y + 12
    const outsideModal = clickX < modalBox.x || clickX > modalBox.x + modalBox.width || clickY < modalBox.y || clickY > modalBox.y + modalBox.height
    const outsidePopover = clickX < listboxBox.x || clickX > listboxBox.x + listboxBox.width || clickY < listboxBox.y || clickY > listboxBox.y + listboxBox.height
    if (!outsideModal || !outsidePopover) throw new Error('overlay click point is not outside the modal and popover')
    await page.mouse.click(clickX, clickY)
    const visible = async () => page.getByRole('listbox').isVisible().catch(() => false)
    await expect.poll(visible, {timeout: 2_000}).toBe(expectedBug)
    const listboxVisible = await visible()
    const environmentValid = pageErrors.length === 0
    const triggerValid = geometryValid && outsideModal && outsidePopover
    const bugObserved = environmentValid && triggerValid && listboxVisible
    Object.assign(observation, {environment_valid: environmentValid, trigger_valid: triggerValid, bug_observed: bugObserved, listbox_visible_after_overlay_click: listboxVisible, geometry: {overlay: overlayBox, modal: modalBox, input: inputBox, button: buttonBox, listbox: listboxBox}, click: {x: clickX, y: clickY}})
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
