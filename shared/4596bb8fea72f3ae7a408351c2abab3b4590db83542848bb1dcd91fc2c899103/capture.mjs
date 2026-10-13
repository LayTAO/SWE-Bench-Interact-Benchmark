import fs from 'node:fs'
import path from 'node:path'
import {chromium} from '/tooling/node_modules/playwright/index.mjs'

const [variant, baseURL, outputDir] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_EXECUTABLE
if (!['buggy', 'fixed'].includes(variant) || !baseURL || !outputDir || !executablePath) throw new Error('capture arguments missing')
fs.mkdirSync(outputDir, {recursive: true})
const observation = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-5692', variant, environment_valid: false, rendering_valid: false, trigger_valid: false, initial_selected: '', final_selected: '', attempted_date: '', bug_observed: false, oracle_passed: false, console_errors: [], page_errors: []}
const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']})
const context = await browser.newContext({viewport: {width: 960, height: 600}, recordVideo: {dir: path.join(outputDir, '.video'), size: {width: 960, height: 600}}})
await context.tracing.start({screenshots: true, snapshots: true, sources: true})
const page = await context.newPage()
page.on('console', message => { if (message.type() === 'error' && !/favicon|404/.test(message.text())) observation.console_errors.push(message.text()) })
page.on('pageerror', error => observation.page_errors.push(error.message))
await page.goto(baseURL, {waitUntil: 'networkidle'})
const calendar = page.getByRole('application', {name: /Appointment date/})
const grid = page.getByRole('grid')
const day16 = page.getByRole('grid').getByRole('button').filter({hasText: '16'}).first()
await calendar.waitFor({state: 'visible'})
await day16.waitFor({state: 'visible'})
observation.environment_valid = true
observation.rendering_valid = await grid.isVisible()
observation.trigger_valid = true
observation.initial_selected = await day16.getAttribute('aria-label')
await day16.click()
await day16.press('ArrowLeft')
observation.attempted_date = await page.evaluate(() => document.activeElement?.textContent?.trim() || '')
await page.keyboard.press('Enter')
await page.waitForTimeout(100)
const selected = page.locator('[role="gridcell"][aria-selected="true"] [role="button"], [role="gridcell"] [role="button"][data-selected]')
observation.final_selected = await selected.first().innerText()
const clean = observation.console_errors.length === 0 && observation.page_errors.length === 0
const selectedExpected = observation.final_selected === '16'
observation.bug_observed = variant === 'buggy' && !selectedExpected && clean
observation.oracle_passed = variant === 'fixed' ? selectedExpected && clean : observation.bug_observed
await page.screenshot({path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: false})
const video = page.video()
await context.tracing.stop({path: path.join(outputDir, `${variant}-trace.zip`)})
await context.close()
if (video) fs.renameSync(await video.path(), path.join(outputDir, `${variant}-video.webm`))
await browser.close()
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(observation, null, 2)}\n`)
console.log(JSON.stringify(observation))
if (!observation.oracle_passed) process.exit(9)
