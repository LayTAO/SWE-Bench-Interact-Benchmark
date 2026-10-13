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
const trigger = page.locator('.el-table__column-filter-trigger').first()
await trigger.waitFor({ state: 'visible' })
await trigger.click()
const item = page.locator('.el-table-filter__list-item').nth(1)
await item.waitFor({ state: 'visible' })
await item.click()
await page.waitForTimeout(100)
const filtered = await page.locator('#filtered').textContent()
const payload = await page.locator('#payload').textContent()
const oraclePassed = filtered === '[]' && payload?.includes('John Lasseter')

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
  action: 'Open the director filter and select the only filter option',
  filtered,
  payload,
  oracle_passed: oraclePassed,
  console_errors: consoleErrors,
}
fs.writeFileSync(
  path.join(outputDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`,
)
console.log(JSON.stringify(observation))
