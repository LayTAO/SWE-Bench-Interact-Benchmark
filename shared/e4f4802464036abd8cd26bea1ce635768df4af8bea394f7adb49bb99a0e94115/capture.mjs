import fs from 'node:fs'
import path from 'node:path'
import {chromium} from 'playwright'

const [instanceId, variant, baseURL, outputDir] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_EXECUTABLE
if (!instanceId || !variant || !baseURL || !outputDir || !executablePath) throw new Error('missing capture arguments')

fs.mkdirSync(outputDir, {recursive: true})
const videoDir = path.join(outputDir, '.video')
fs.mkdirSync(videoDir, {recursive: true})
const consoleErrors = []
const pageErrors = []
const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']})
const chromiumVersion = browser.version()
const context = await browser.newContext({viewport: {width: 960, height: 600}, recordVideo: {dir: videoDir, size: {width: 960, height: 600}}})
await context.tracing.start({screenshots: true, snapshots: true, sources: true})
const page = await context.newPage()
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('pageerror', error => pageErrors.push(error.message))
const sleep = milliseconds => page.waitForTimeout(milliseconds)
const rect = async locator => locator.boundingBox().catch(() => null)
const visible = async locator => locator.isVisible().catch(() => false)

let measured = {}
let actionError = null
try {
  await page.goto(baseURL, {waitUntil: 'domcontentloaded'})
  await page.locator('#oracle-ready').waitFor({state: 'attached', timeout: 30_000})
  await sleep(700)

  if (instanceId === 'IR-M-088') {
    const parentPanel = page.locator('#parent-panel')
    const childAction = page.locator('#child-action')
    const before = {
      parent_visible: await visible(parentPanel),
      child_visible: await visible(childAction),
      parent_rect: await rect(parentPanel),
      child_rect: await rect(childAction),
      parent_expanded: await page.locator('#parent-trigger').getAttribute('aria-expanded'),
    }
    await childAction.click()
    await sleep(500)
    const after = {
      parent_visible: await visible(parentPanel),
      child_visible: await visible(childAction),
      parent_rect: await rect(parentPanel),
      parent_expanded: await page.locator('#parent-trigger').getAttribute('aria-expanded'),
      parent_close_count: await page.evaluate(() => window.__parentCloseCount ?? -1),
    }
    measured = {before, after}
    measured.oracle_passed = before.parent_visible && before.child_visible && after.parent_visible && after.parent_expanded === 'true' && after.parent_close_count === 0
  } else if (instanceId === 'IR-M-089') {
    const input = page.getByRole('combobox')
    await page.getByRole('button').first().click()
    await sleep(500)
    const initialListbox = page.getByRole('listbox')
    const initialRect = await rect(initialListbox)
    const initialOptions = await page.getByRole('option').count()
    if (!initialRect) throw new Error('initial listbox has no rectangle')
    await input.fill('Nuclear')
    await sleep(500)
    const filteredRect = await rect(page.getByRole('listbox'))
    const filteredOptions = await page.getByRole('option').count()
    if (!filteredRect) throw new Error('filtered listbox has no rectangle')
    const clickX = filteredRect.x + Math.min(80, filteredRect.width / 2)
    const clickY = Math.min(initialRect.y + initialRect.height - 12, filteredRect.y + filteredRect.height + 32)
    if (clickY <= filteredRect.y + filteredRect.height + 2) throw new Error('no stale menu area available')
    await page.mouse.move(clickX, clickY)
    await page.mouse.down()
    await sleep(250)
    const during = {
      input_value: await input.inputValue(),
      visible_option_count: await page.getByRole('option').count(),
      listbox_visible: await visible(page.getByRole('listbox')),
    }
    await page.mouse.up()
    await sleep(900)
    const selections = await page.evaluate(() => window.__selections ?? [])
    const after = {
      input_value: await input.inputValue(),
      selections,
      aria_expanded: await input.getAttribute('aria-expanded'),
      listbox_visible: await visible(page.getByRole('listbox')),
    }
    measured = {initial: {rect: initialRect, option_count: initialOptions}, filtered: {rect: filteredRect, option_count: filteredOptions}, stale_click: {x: clickX, y: clickY}, during, after}
    measured.oracle_passed = initialOptions === 9 && filteredOptions === 1 && selections.length === 0 && after.aria_expanded !== 'true' && !after.listbox_visible
  } else if (instanceId === 'IR-M-092') {
    const input = page.getByRole('combobox')
    await page.getByRole('button').first().click()
    await sleep(700)
    const listbox = page.getByRole('listbox')
    if (!(await visible(listbox))) throw new Error('listbox did not open')
    const target = await page.evaluate(() => {
      const listbox = document.querySelector('[role="listbox"]')
      const elements = [...document.querySelectorAll('*')]
      const candidates = elements.filter(element => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        const related = element === listbox || element.contains(listbox) || listbox?.contains(element)
        return related && rect.width > 0 && rect.height > 0 && element.scrollHeight > element.clientHeight + 4 && /(auto|scroll)/.test(style.overflowY)
      }).sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))
      const element = candidates[0]
      if (!element) return null
      element.setAttribute('data-ir-scroll-target', 'true')
      const box = element.getBoundingClientRect()
      return {scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight, overflowY: getComputedStyle(element).overflowY, rect: {x: box.x, y: box.y, width: box.width, height: box.height}}
    })
    if (!target) throw new Error('no scroll container found')
    const scrollTarget = page.locator('[data-ir-scroll-target="true"]')
    const box = await rect(scrollTarget)
    if (!box) throw new Error('scroll target has no rectangle')
    const triggerRect = await rect(input)
    const listboxRectBefore = await rect(listbox)
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, box.height - 10))
    await page.mouse.wheel(0, 900)
    const scrollTopSamples = []
    for (let index = 0; index < 8; index += 1) {
      await sleep(100)
      scrollTopSamples.push(await scrollTarget.evaluate(element => element.scrollTop))
    }
    const after = await scrollTarget.evaluate(element => ({scrollTop: element.scrollTop, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight}))
    const ariaExpanded = await input.getAttribute('aria-expanded')
    const listboxRectAfter = await rect(listbox)
    measured = {before: target, after, scroll_top_samples: scrollTopSamples, aria_expanded: ariaExpanded, listbox_visible: await visible(listbox), trigger_rect: triggerRect, listbox_rect_before: listboxRectBefore, listbox_rect_after: listboxRectAfter}
    measured.oracle_passed = target.scrollHeight > target.clientHeight && after.scrollTop > target.scrollTop && ariaExpanded === 'true' && measured.listbox_visible
  } else {
    throw new Error(`unsupported instance ${instanceId}`)
  }
} catch (error) {
  actionError = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  measured = {...measured, oracle_passed: false}
}

await page.evaluate(({instanceId, variant, measured, actionError}) => {
  const output = document.createElement('pre')
  output.id = 'oracle-observation'
  output.dataset.oraclePassed = String(measured.oracle_passed)
  output.style.cssText = 'position:fixed;left:8px;bottom:8px;max-width:944px;max-height:230px;overflow:auto;z-index:2147483647;background:#111;color:#fff;padding:10px;font:12px monospace;white-space:pre-wrap'
  output.textContent = JSON.stringify({instanceId, variant, measured, actionError}, null, 2)
  document.body.appendChild(output)
}, {instanceId, variant, measured, actionError}).catch(() => {})

const screenshot = path.join(outputDir, `${variant}-screenshot.png`)
await page.screenshot({path: screenshot, fullPage: true}).catch(() => {})
const video = page.video()
await context.tracing.stop({path: path.join(outputDir, `${variant}-trace.zip`)})
await page.close()
await context.close()
if (video) {
  const source = await video.path().catch(() => null)
  if (source && fs.existsSync(source)) fs.renameSync(source, path.join(outputDir, `${variant}-video.webm`))
}
await browser.close()

const observation = {
  instance_id: instanceId, variant, action_error: actionError, console_errors: consoleErrors, page_errors: pageErrors,
  chromium_version: chromiumVersion, chromium_executable: executablePath, viewport: {width: 960, height: 600},
  workers: 1, retries: 0, used_for_scoring: false, ...measured,
}
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(observation, null, 2)}\n`)
console.log(JSON.stringify(observation))
if (chromiumVersion !== '145.0.7632.6') process.exitCode = 3
