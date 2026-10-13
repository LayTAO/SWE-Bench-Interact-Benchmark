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
const pageErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => pageErrors.push(String(error)))

await page.goto(url, { waitUntil: 'networkidle' })
const inputs = page.locator('[data-scope="date-picker"][data-part="input"]')
await page.waitForTimeout(500)
if (await inputs.count() !== 2) {
  throw new Error(`expected two Zag date-picker inputs; console=${JSON.stringify(consoleErrors)}; body=${await page.locator('body').innerText()}`)
}

const startInput = inputs.nth(0)
const endInput = inputs.nth(1)
const outside = page.getByRole('button', { name: 'Outside element' })
await startInput.click()
await startInput.pressSequentially('06/20/2024')
const typedStartValue = await startInput.inputValue()
await outside.click()
await endInput.click()
await endInput.pressSequentially('06/10/2024')
const typedEndValue = await endInput.inputValue()
await outside.click()
await page.waitForTimeout(250)

const startValue = await startInput.inputValue()
const endValue = await endInput.inputValue()
const selectedText = (await page.locator('.date-output').textContent())?.replace(/\s+/g, ' ').trim() || ''
const environmentValid = (await inputs.count()) === 2 && (await outside.count()) === 1
const renderingValid = await startInput.isVisible() && await endInput.isVisible() && await outside.isVisible()
const triggerValid = typedStartValue === '06/20/2024' && typedEndValue === '06/10/2024'
const normalized = startValue === '06/10/2024' && endValue === '06/20/2024'
const bugObserved = triggerValid && !normalized
const oraclePassed = environmentValid && renderingValid && triggerValid &&
  (variant === 'buggy' ? bugObserved : !bugObserved && normalized)

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
  instance_id: 'chakra-ui__zag-3186',
  variant,
  chromium_version: '145.0.7632.6',
  chromium_executable: executablePath,
  viewport: { width: 960, height: 720 },
  workers: 1,
  retries: 0,
  used_for_scoring: true,
  action: 'Enter a later start date and earlier end date, clicking the outside control after each input',
  environment_valid: environmentValid,
  rendering_valid: renderingValid,
  trigger_valid: triggerValid,
  bug_observed: bugObserved,
  typed_start_value: typedStartValue,
  typed_end_value: typedEndValue,
  start_value: startValue,
  end_value: endValue,
  selected_text: selectedText,
  oracle_passed: oraclePassed,
  console_errors: consoleErrors,
  page_errors: pageErrors,
}
fs.writeFileSync(
  path.join(outputDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`,
)
console.log(JSON.stringify(observation))
if (!oraclePassed) process.exitCode = 9
