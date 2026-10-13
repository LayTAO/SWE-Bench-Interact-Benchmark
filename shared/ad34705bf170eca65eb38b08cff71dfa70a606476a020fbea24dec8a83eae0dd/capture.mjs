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
await page.goto(baseURL, {waitUntil: 'networkidle'})
const shell = page.getByTestId('scroll-shell')
const upload = page.getByRole('button', {name: 'Click to upload'})
await upload.waitFor({state: 'visible'})
await shell.evaluate(element => { element.scrollTop = 430 })
await page.waitForFunction(() => document.querySelector('[data-testid=scroll-shell]')?.scrollTop === 430)
const before = await page.evaluate(() => {
  const shell = document.querySelector('[data-testid=scroll-shell]')
  const hidden = document.querySelector('button[aria-label="DropZone"]')
  const upload = document.querySelector('.upload-button')
  const shellRect = shell.getBoundingClientRect()
  return {scrollTop: shell.scrollTop, hiddenTop: hidden.getBoundingClientRect().top, uploadTop: upload.getBoundingClientRect().top, shellTop: shellRect.top, shellBottom: shellRect.bottom, activeLabel: document.activeElement?.getAttribute('aria-label') || ''}
})
await upload.click()
await page.waitForTimeout(150)
const after = await page.evaluate(() => {
  const shell = document.querySelector('[data-testid=scroll-shell]')
  const hidden = document.querySelector('button[aria-label="DropZone"]')
  const upload = document.querySelector('.upload-button')
  return {scrollTop: shell.scrollTop, hiddenTop: hidden.getBoundingClientRect().top, uploadTop: upload.getBoundingClientRect().top, activeLabel: document.activeElement?.getAttribute('aria-label') || ''}
})
const scrollDelta = after.scrollTop - before.scrollTop
const relevantErrors = errors.filter(error => !/favicon|404/.test(error))
const precondition = before.uploadTop > before.shellTop && before.uploadTop < before.shellBottom && before.hiddenTop < before.shellTop
const oraclePassed = precondition && after.activeLabel === 'DropZone' && relevantErrors.length === 0 && ((variant === 'buggy' && Math.abs(scrollDelta) > 100) || (variant === 'fixed' && Math.abs(scrollDelta) <= 1))
const observation = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-10092', variant, precondition, before, after, scroll_delta: scrollDelta, console_errors: relevantErrors, environment_valid: true, rendering_valid: true, trigger_valid: true, oracle_passed: oraclePassed, bug_observed: variant === 'buggy' ? oraclePassed : !oraclePassed, used_for_scoring: false}
await page.screenshot({path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: false})
const video = page.video()
await context.tracing.stop({path: path.join(outputDir, `${variant}-trace.zip`)})
await context.close()
if (video) fs.renameSync(await video.path(), path.join(outputDir, `${variant}-video.webm`))
await browser.close()
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(observation, null, 2)}\n`)
console.log(JSON.stringify(observation))
if (!oraclePassed) process.exit(9)
