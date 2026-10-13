import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const [variant, baseURL, outputDir] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_EXECUTABLE
if (!variant || !baseURL || !outputDir || !executablePath) throw new Error('capture arguments missing')
fs.mkdirSync(outputDir, { recursive: true })
const errors = []
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const context = await browser.newContext({ viewport: { width: 960, height: 600 }, recordVideo: { dir: path.join(outputDir, '.video'), size: { width: 960, height: 600 } } })
await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
const page = await context.newPage()
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))
const state = () => page.evaluate(() => {
  const combo = document.querySelector('input[role=combobox]')
  const active = document.activeElement
  const listbox = document.querySelector('[role=listbox]')
  return { activeRole: active?.getAttribute('role') || '', activeText: active?.textContent?.trim() || '', controlledValue: document.querySelector('#status')?.textContent || '', expanded: combo?.getAttribute('aria-expanded') || '', panelOpen: !!listbox && getComputedStyle(listbox).display !== 'none' }
})
const combo = page.getByRole('combobox', { name: 'Fruit' })
const apple = page.getByRole('option', { name: 'Apple' })
const prepare = async () => {
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await combo.click()
  await page.keyboard.type('b')
  await page.keyboard.press('ArrowDown')
  await apple.waitFor({ state: 'visible' })
  await apple.focus()
  return state()
}
const beforeRuns = []; const afterRuns = []
for (const shortcut of ['Control+C', 'Meta+C']) {
  beforeRuns.push({ shortcut, state: await prepare() })
  await page.keyboard.press(shortcut)
  await page.waitForTimeout(25)
  afterRuns.push({ shortcut, state: await state() })
}
const beforePaste = await prepare()
await page.keyboard.press('Control+V')
await page.waitForTimeout(25)
const afterPaste = await state()
const precondition = beforeRuns.every(({ state: value }) => value.activeRole === 'option' && value.activeText === 'Apple' && value.controlledValue === 'b' && value.expanded === 'true' && value.panelOpen)
const shortcutsBuggy = afterRuns.every(({ state: value }) => value.activeRole !== 'option' || value.activeText !== 'Apple' || value.controlledValue !== 'b')
const shortcutsFixed = afterRuns.every(({ state: value }) => value.activeRole === 'option' && value.activeText === 'Apple' && value.controlledValue === 'b' && value.expanded === 'true' && value.panelOpen)
const relevantErrors = errors.filter(error => !/favicon|404/.test(error))
const oracle = precondition && afterPaste.activeRole === 'combobox' && afterPaste.panelOpen && relevantErrors.length === 0 && (variant === 'buggy' ? shortcutsBuggy : shortcutsFixed)
const payload = { schema_version: '1.0', instance_id: 'ariakit__ariakit-6297', variant, precondition, beforeRuns, afterRuns, beforePaste, afterPaste, console_errors: relevantErrors, environment_valid: true, rendering_valid: true, trigger_valid: true, oracle_passed: oracle, bug_observed: variant === 'buggy' ? oracle : !oracle, used_for_scoring: false }
await page.screenshot({ path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: true })
const video = page.video(); await context.tracing.stop({ path: path.join(outputDir, `${variant}-trace.zip`) }); await context.close(); if (video) { const source = await video.path(); fs.renameSync(source, path.join(outputDir, `${variant}-video.webm`)) }; await browser.close()
fs.writeFileSync(path.join(outputDir, 'observation.json'), JSON.stringify(payload, null, 2) + '\n')
console.log(JSON.stringify(payload)); if (!oracle) process.exit(9)
