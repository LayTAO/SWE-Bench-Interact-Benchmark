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
const editors = page.locator('.el-date-range-picker__time-header .el-date-range-picker__editors-wrap')
const leftInput = editors.nth(0).locator('input').first()
const rightInput = editors.nth(1).locator('input').first()
await leftInput.waitFor({ state: 'visible' })
await rightInput.fill('2026-04-01')
await page.waitForTimeout(50)
const startAfterIntermediate = await leftInput.inputValue()
const modelStartAfterIntermediate = await page.locator('#model-start').textContent()
await rightInput.fill('2026-04-20')
await rightInput.press('Tab')
await page.waitForTimeout(100)
const startAfterFinal = await leftInput.inputValue()
const modelStartAfterFinal = await page.locator('#model-start').textContent()
const oraclePassed = startAfterIntermediate === '2026-04-01' && modelStartAfterIntermediate === '2026-04-01' && startAfterFinal === '2026-04-01' && modelStartAfterFinal === '2026-04-01'

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
  action: 'Enter an intermediate end date and then complete the target date',
  start_after_intermediate: startAfterIntermediate,
  model_start_after_intermediate: modelStartAfterIntermediate,
  start_after_final: startAfterFinal,
  model_start_after_final: modelStartAfterFinal,
  oracle_passed: oraclePassed,
  console_errors: consoleErrors,
}
fs.writeFileSync(
  path.join(outputDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`,
)
console.log(JSON.stringify(observation))
