import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const [instanceId, variant, baseURL, outputDir] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_EXECUTABLE
if (!instanceId || !variant || !baseURL || !outputDir || !executablePath) {
  throw new Error('usage: capture.mjs <instance> <buggy|gold> <base-url> <output-dir>; CHROMIUM_EXECUTABLE is required')
}

fs.mkdirSync(outputDir, { recursive: true })
const videoDir = path.join(outputDir, '.video')
fs.mkdirSync(videoDir, { recursive: true })
const consoleErrors = []
const pageErrors = []
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const chromiumVersion = browser.version()
const context = await browser.newContext({
  viewport: { width: 960, height: 600 },
  recordVideo: { dir: videoDir, size: { width: 960, height: 600 } },
})
await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
const page = await context.newPage()
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('pageerror', error => pageErrors.push(error.message))

const visibleCount = async locator => {
  let count = 0
  for (const item of await locator.all()) if (await item.isVisible().catch(() => false)) count += 1
  return count
}
const sleep = milliseconds => page.waitForTimeout(milliseconds)

let measured = {}
let actionError = null
try {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.locator('#oracle-ready').waitFor({ state: 'attached', timeout: 30_000 })

  if (instanceId === 'IR-M-072') {
    await page.getByRole('button', { name: 'Run container switch' }).click()
    await sleep(500)
    const helloVisible = await page.getByText('Hello from modal').isVisible().catch(() => false)
    measured = { hello_visible_after_container_switch: helloVisible, page_error_count: pageErrors.length }
    measured.oracle_passed = helloVisible && pageErrors.length === 0
  } else if (instanceId === 'IR-M-075') {
    const trigger = page.getByRole('combobox')
    const box = await trigger.boundingBox()
    if (!box) throw new Error('Select trigger has no bounding box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await sleep(250)
    const openedOnDown = await visibleCount(page.getByRole('listbox')) > 0
    await page.mouse.move(900, 550)
    await page.mouse.up()
    await sleep(500)
    const visibleAfterRelease = await visibleCount(page.getByRole('listbox')) > 0
    measured = { opened_on_pointer_down: openedOnDown, listbox_visible_after_outside_release: visibleAfterRelease }
    measured.oracle_passed = openedOnDown && !visibleAfterRelease
  } else if (instanceId === 'IR-M-076') {
    await page.locator('.p-multiselect').click()
    await sleep(300)
    const optionCount = await visibleCount(page.locator('.p-multiselect-option'))
    const checkboxCount = await visibleCount(page.locator('.p-multiselect-option .p-checkbox'))
    if (optionCount) await page.locator('.p-multiselect-option').first().click()
    const selectedText = await page.locator('#selection').textContent()
    measured = { visible_option_count: optionCount, visible_checkbox_count: checkboxCount, selected_text: selectedText }
    measured.oracle_passed = optionCount === 3 && /New York/.test(selectedText ?? '')
  } else if (instanceId === 'IR-M-077') {
    const events = await page.getByTestId('portaled-input').evaluate(input => [' ', 'Enter'].map(key => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      const dispatchResult = input.dispatchEvent(event)
      return { key, defaultPrevented: event.defaultPrevented, dispatchResult }
    }))
    measured = { key_events: events }
    measured.oracle_passed = events.length === 2 && events.every(event => event.defaultPrevented === false && event.dispatchResult === true)
  } else if (instanceId === 'IR-M-078') {
    await page.locator('input[type="text"]').first().click()
    await sleep(350)
    const listboxVisible = await visibleCount(page.getByRole('listbox')) > 0
    const onOpenCount = await page.evaluate(() => window.__openCount ?? 0)
    measured = { listbox_visible_after_textbox_click: listboxVisible, on_open_count: onOpenCount }
    measured.oracle_passed = listboxVisible && onOpenCount === 1
  } else if (instanceId === 'IR-M-080') {
    await page.getByRole('button', { name: 'Programmatic click' }).click()
    await sleep(250)
    const menuVisible = await visibleCount(page.getByRole('menu')) > 0
    const expanded = await page.getByRole('button', { name: 'Trigger' }).getAttribute('aria-expanded')
    const itemCount = await page.getByRole('menuitem').count()
    measured = { menu_visible: menuVisible, aria_expanded: expanded, menu_item_count: itemCount }
    measured.oracle_passed = menuVisible && expanded === 'true' && itemCount === 3
  } else if (instanceId === 'IR-M-081') {
    const trigger = page.getByTestId('trigger')
    await trigger.click()
    const candidates = page.locator('[data-radix-vue-calendar-cell-trigger]:not([data-outside-view]), [data-reka-calendar-cell-trigger]:not([data-outside-view])')
    const target = candidates.first()
    await target.click()
    await sleep(150)
    if (!(await page.getByTestId('calendar').isVisible().catch(() => false))) await trigger.click()
    const selected = page.locator('[data-selected]').first()
    if (await selected.count()) await selected.click()
    else await target.click()
    await sleep(250)
    const selectedCount = await page.locator('[data-selected]').count()
    const targetErrors = [...consoleErrors, ...pageErrors].filter(message => !message.includes('404'))
    measured = { selected_marker_count_after_reselect: selectedCount, target_error_count: targetErrors.length, target_errors: targetErrors }
    measured.oracle_passed = selectedCount === 0 && targetErrors.length === 0
  } else if (instanceId === 'IR-M-082') {
    const input = page.locator('input').first()
    await input.fill('a')
    await sleep(200)
    const apple = page.getByRole('option', { name: 'Apple', exact: true })
    await apple.click()
    await sleep(250)
    const collectionTexts = (await page.locator('[data-reka-collection-item]').allTextContents()).map(text => text.trim()).filter(Boolean)
    const activeIsInput = await page.evaluate(() => document.activeElement?.tagName === 'INPUT')
    measured = { collection_item_texts: collectionTexts, active_element_is_input: activeIsInput }
    measured.oracle_passed = collectionTexts.includes('Apple') && !collectionTexts.includes('a') && activeIsInput
  } else if (instanceId === 'IR-M-083') {
    await page.locator('button').first().click()
    const input = page.locator('input').first()
    await input.focus()
    await page.evaluate(() => {
      const input = document.querySelector('input')
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }))
      input.value = 'zzzzz'
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'zzzzz', inputType: 'insertCompositionText', isComposing: true }))
    })
    await sleep(150)
    const visibleDuring = await visibleCount(page.getByRole('option'))
    const emptyDuring = await page.getByRole('listbox').getAttribute('data-empty')
    const updatesDuring = await page.evaluate(() => (window.__updates ?? []).length)
    await page.evaluate(() => {
      const input = document.querySelector('input')
      input.value = '香'
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '香' }))
    })
    await sleep(150)
    const updatesAfter = await page.evaluate(() => window.__updates ?? [])
    measured = { visible_options_during_composition: visibleDuring, data_empty_during_composition: emptyDuring, update_count_during_composition: updatesDuring, updates_after_composition: updatesAfter }
    measured.oracle_passed = visibleDuring > 0 && emptyDuring === null && updatesDuring === 0 && updatesAfter.length > 0
  } else if (instanceId === 'IR-M-084') {
    await page.getByRole('button', { name: 'Clear model' }).click()
    await page.getByTestId('trigger').click()
    const day = page.locator('[data-reka-calendar-cell-trigger]:not([data-outside-view]):not([data-unavailable]), [data-radix-vue-calendar-cell-trigger]:not([data-outside-view]):not([data-unavailable])').first()
    await day.click()
    await sleep(250)
    const selected = await page.evaluate(() => window.__lastValue ?? null)
    measured = { selected_value: selected }
    measured.oracle_passed = Boolean(selected) && selected.hour === 0 && selected.minute === 0 && selected.second === 0 && selected.millisecond === 0
  } else if (instanceId === 'IR-M-085') {
    const item = page.getByRole('option').first()
    const before = { dataDisabled: await item.getAttribute('data-disabled'), disabled: await item.getAttribute('disabled') }
    await page.getByRole('button', { name: /Toggle disabled/ }).click()
    await sleep(100)
    const enabledToDisabled = { dataDisabled: await item.getAttribute('data-disabled'), disabled: await item.getAttribute('disabled') }
    await page.getByRole('button', { name: /Toggle disabled/ }).click()
    await sleep(100)
    const disabledToEnabled = { dataDisabled: await item.getAttribute('data-disabled'), disabled: await item.getAttribute('disabled') }
    measured = { before, enabled_to_disabled: enabledToDisabled, disabled_to_enabled: disabledToEnabled }
    measured.oracle_passed = before.dataDisabled === null && enabledToDisabled.dataDisabled !== null && enabledToDisabled.disabled !== null && disabledToEnabled.dataDisabled === null && disabledToEnabled.disabled === null
  } else if (instanceId === 'IR-M-086') {
    const focusButton = page.getByRole('button', { name: 'Focus autocomplete' })
    const input = page.locator('input').first()
    const focusedAfterClicks = []
    for (let index = 0; index < 4; index += 1) {
      await focusButton.click()
      await sleep(100)
      focusedAfterClicks.push(await input.evaluate(element => document.activeElement === element))
    }
    measured = { focused_after_clicks: focusedAfterClicks }
    measured.oracle_passed = focusedAfterClicks.every(Boolean)
  } else if (instanceId === 'IR-M-087') {
    const input = page.getByTestId('field').locator('input')
    await input.click()
    await sleep(400)
    const initiallyVisible = await page.getByTestId('menu-content').isVisible().catch(() => false)
    await input.evaluate(element => element.blur())
    await sleep(500)
    const visibleAfterInputBlur = await page.getByTestId('menu-content').isVisible().catch(() => false)
    const inner = page.getByTestId('inner-btn')
    if (await inner.isVisible().catch(() => false)) {
      await inner.focus()
      await sleep(50)
      await inner.evaluate(element => element.blur())
    }
    await sleep(500)
    const visibleAfterInnerBlur = await page.getByTestId('menu-content').isVisible().catch(() => false)
    measured = { initially_visible: initiallyVisible, visible_after_input_blur: visibleAfterInputBlur, visible_after_inner_blur: visibleAfterInnerBlur }
    measured.oracle_passed = initiallyVisible && visibleAfterInputBlur && visibleAfterInnerBlur
  } else {
    throw new Error(`unsupported instance ${instanceId}`)
  }
} catch (error) {
  actionError = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  measured = { ...measured, oracle_passed: false }
}

await page.evaluate(({ instanceId, variant, measured, actionError }) => {
  const output = document.createElement('pre')
  output.id = 'oracle-observation'
  output.dataset.oraclePassed = String(measured.oracle_passed)
  output.style.cssText = 'position:fixed;left:8px;bottom:8px;max-width:944px;max-height:220px;overflow:auto;z-index:2147483647;background:#111;color:#fff;padding:10px;font:12px monospace;white-space:pre-wrap'
  output.textContent = JSON.stringify({ instanceId, variant, measured, actionError }, null, 2)
  document.body.appendChild(output)
}, { instanceId, variant, measured, actionError }).catch(() => {})

const screenshot = path.join(outputDir, `${variant}-screenshot.png`)
await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {})
const video = page.video()
await context.tracing.stop({ path: path.join(outputDir, `${variant}-trace.zip`) })
await page.close()
await context.close()
if (video) {
  const source = await video.path().catch(() => null)
  if (source && fs.existsSync(source)) fs.renameSync(source, path.join(outputDir, `${variant}-video.webm`))
}
await browser.close()

const observation = {
  instance_id: instanceId,
  variant,
  action_error: actionError,
  console_errors: consoleErrors,
  page_errors: pageErrors,
  chromium_version: chromiumVersion,
  chromium_executable: executablePath,
  viewport: { width: 960, height: 600 },
  workers: 1,
  retries: 0,
  used_for_scoring: false,
  ...measured,
}
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(observation, null, 2)}\n`)
console.log(JSON.stringify(observation))
if (chromiumVersion !== '145.0.7632.6') process.exitCode = 3
