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
const narrow = page.locator('#basic-truncate')
const wide = page.locator('#no-truncate')
await narrow.waitFor({ state: 'attached' })
await wide.waitFor({ state: 'attached' })
await page.waitForTimeout(250)
const narrowTabIndex = await narrow.getAttribute('tabindex')
const wideTabIndex = await wide.getAttribute('tabindex')
const tooltipBeforeFocus = await page.locator('.pf-v6-c-tooltip').count()
await narrow.focus()
await page.waitForTimeout(50)
const activeId = await page.evaluate(() => document.activeElement?.id || null)
const tooltipAfterFocus = await page.locator('.pf-v6-c-tooltip').count()
const oraclePassed =
  narrowTabIndex === '0' &&
  wideTabIndex === null &&
  activeId === 'basic-truncate' &&
  tooltipBeforeFocus === 0 &&
  tooltipAfterFocus > 0

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
  action: 'Focus the narrow Truncate and inspect tabindex, activeElement, and Tooltip DOM',
  narrow_tabindex: narrowTabIndex,
  wide_tabindex: wideTabIndex,
  active_id: activeId,
  tooltip_before_focus: tooltipBeforeFocus,
  tooltip_after_focus: tooltipAfterFocus,
  oracle_passed: oraclePassed,
  console_errors: consoleErrors,
}
fs.writeFileSync(
  path.join(outputDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`,
)
console.log(JSON.stringify(observation))
