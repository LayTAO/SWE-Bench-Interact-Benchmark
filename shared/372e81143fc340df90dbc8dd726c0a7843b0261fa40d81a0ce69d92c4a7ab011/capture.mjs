import fs from 'node:fs'
import path from 'node:path'
import {chromium} from 'playwright'

const [variant, baseURL, outputDir] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_EXECUTABLE
if (!['buggy', 'fixed'].includes(variant) || !baseURL || !outputDir || !executablePath) throw new Error('capture arguments missing')
fs.mkdirSync(outputDir, {recursive: true})
const errors = []
const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']})
const context = await browser.newContext({viewport: {width: 960, height: 600}, recordVideo: {dir: path.join(outputDir, '.video'), size: {width: 960, height: 600}}})
await context.tracing.start({screenshots: true, snapshots: true, sources: true})
const page = await context.newPage()
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(error.message))
await page.goto(baseURL, {waitUntil: 'domcontentloaded', timeout: 5000})
await page.waitForTimeout(100)
const input = page.getByTestId('autocomplete-input')
const option = page.getByRole('menuitem', {name: 'Rename symbol'})
await input.click()
await input.waitFor({state: 'visible'})
const inputFocusedBeforeHover = await input.evaluate(element => element.hasAttribute('data-focused'))
await option.hover()
const hoverState = await option.evaluate(element => ({focused: element.hasAttribute('data-focused'), activeDescendant: document.querySelector('[data-testid="autocomplete-input"]')?.getAttribute('aria-activedescendant')}))
await input.click()
await page.waitForTimeout(150)
const observation = await input.evaluate(element => ({
  document_active_element_is_input: document.activeElement === element,
  input_data_focused: element.hasAttribute('data-focused'),
  input_data_focus_visible: element.hasAttribute('data-focus-visible'),
  aria_activedescendant: element.getAttribute('aria-activedescendant'),
  focused_option: document.querySelector('[role="menuitem"][data-focused]')?.textContent?.trim() || null,
}))
const relevantErrors = errors.filter(error => !/favicon|404/.test(error))
const precondition = inputFocusedBeforeHover && hoverState.focused && !!hoverState.activeDescendant
const oraclePassed = precondition && observation.document_active_element_is_input && relevantErrors.length === 0 && (variant === 'buggy' ? (!observation.input_data_focused && observation.aria_activedescendant && observation.focused_option === 'Rename symbol') : (observation.input_data_focused && observation.aria_activedescendant === null && observation.focused_option === null))
await page.screenshot({path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: true})
const video = page.video()
await context.tracing.stop({path: path.join(outputDir, `${variant}-trace.zip`)})
await context.close()
if (video) fs.renameSync(await video.path(), path.join(outputDir, `${variant}-video.webm`))
await browser.close()
const payload = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-8198', variant, precondition, input_focused_before_hover: inputFocusedBeforeHover, hover_state: hoverState, ...observation, console_errors: relevantErrors, environment_valid: true, rendering_valid: true, trigger_valid: true, oracle_passed: oraclePassed, bug_observed: variant === 'buggy' ? oraclePassed : !oraclePassed, used_for_scoring: false}
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(payload, null, 2)}\n`)
console.log(JSON.stringify(payload))
if (!oraclePassed) process.exit(9)
