import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const [variant, url, outputDir] = process.argv.slice(2)
if (!['buggy', 'fixed'].includes(variant) || !url || !outputDir) {
  throw new Error('usage: capture.mjs buggy|fixed URL OUTPUT_DIR')
}

fs.mkdirSync(outputDir, { recursive: true })
const executablePath =
  process.env.CHROMIUM_EXECUTABLE ||
  '/ms-playwright/chromium-1208/chrome-linux64/chrome'
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
const context = await browser.newContext({
  viewport: { width: 960, height: 720 },
  recordVideo: { dir: outputDir, size: { width: 960, height: 720 } },
})
const page = await context.newPage()
const consoleErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(String(error)))

await page.goto(url, { waitUntil: 'networkidle' })
const inputs = page.locator('.el-range-input')
const endInput = inputs.nth(1)
await endInput.click()
const panel = page.locator('.el-time-range-picker').last()
await panel.waitFor({ state: 'visible' })
const endPanel = panel.locator('.el-time-range-picker__cell').nth(1)
await endPanel.locator('.el-time-spinner__item.is-active').first().hover()
await panel.locator('.el-time-panel__btn.cancel').click()
await panel.waitFor({ state: 'hidden' })

const activeAfterCancel = await page.evaluate(() => {
  const active = document.activeElement
  return {
    tag: active?.tagName || null,
    className: active instanceof HTMLElement ? active.className : null,
    value: active instanceof HTMLInputElement ? active.value : null,
  }
})

await endInput.fill('07:40:00')
const valueAfterManualInput = await endInput.inputValue()
await page.locator('#outside').click()
await page.waitForTimeout(250)
const valueAfterBlur = await endInput.inputValue()
const modelEnd = await page.locator('#model-end').textContent()
const oraclePassed =
  valueAfterManualInput === '07:40:00' &&
  valueAfterBlur === '09:40:00' &&
  modelEnd === '09:40:00'

await page.screenshot({
  path: path.join(outputDir, `${variant}-screenshot.png`),
  fullPage: true,
})
const video = page.video()
await context.close()
const rawVideoPath = await video.path()
fs.renameSync(rawVideoPath, path.join(outputDir, `${variant}-video.webm`))
await browser.close()

const observation = {
  schema_version: '1.0',
  instance_id: 'IR-M-113',
  variant,
  chromium_version: '145.0.7632.6',
  chromium_executable: executablePath,
  viewport: { width: 960, height: 720 },
  workers: 1,
  retries: 0,
  used_for_scoring: false,
  action:
    'Open the range TimePicker, cancel, enter 07:40:00 in the end field, then move focus outside',
  active_after_cancel: activeAfterCancel,
  value_after_manual_input: valueAfterManualInput,
  value_after_blur: valueAfterBlur,
  model_end: modelEnd,
  oracle_passed: oraclePassed,
  console_errors: consoleErrors,
}
fs.writeFileSync(
  path.join(outputDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`,
)
console.log(JSON.stringify(observation))
