import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const [variant, baseURL, outputDir] = process.argv.slice(2)
const executablePath = process.env.CHROMIUM_EXECUTABLE
if (!variant || !baseURL || !outputDir || !executablePath) throw new Error('capture requires variant, URL, output dir and Chromium')
fs.mkdirSync(outputDir, {recursive: true})
const errors = []
const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']})
const context = await browser.newContext({viewport: {width: 960, height: 600}, recordVideo: {dir: path.join(outputDir, '.video'), size: {width: 960, height: 600}}})
await context.tracing.start({screenshots: true, snapshots: true, sources: true})
const page = await context.newPage()
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(e.message))
await page.goto(baseURL, {waitUntil: 'networkidle'})
const tag0 = page.getByRole('textbox', {name: 'tags.0'})
await tag0.waitFor({state: 'visible'})
const before = await page.evaluate(() => ({tags: [...document.querySelectorAll('input[name^="tags."]')].map(x => x.name), emails: [...document.querySelectorAll('input[name^="emails."]')].map(x => x.name), active: document.activeElement?.getAttribute('aria-label') || ''}))
await page.getByRole('button', {name: 'Add tag'}).click()
await page.getByRole('textbox', {name: 'tags.1'}).waitFor({state: 'visible'})
const afterTag = await page.evaluate(() => ({active: document.activeElement?.getAttribute('aria-label') || '', focusedText: document.querySelector('output')?.textContent || ''}))
await page.getByRole('button', {name: 'Add email'}).click()
await page.getByRole('textbox', {name: 'emails.0'}).waitFor({state: 'visible'})
const afterEmail0 = await page.evaluate(() => ({active: document.activeElement?.getAttribute('aria-label') || '', focusedText: document.querySelector('output')?.textContent || ''}))
await page.getByRole('button', {name: 'Add email'}).click()
await page.getByRole('textbox', {name: 'emails.1'}).waitFor({state: 'visible'})
const afterEmail1 = await page.evaluate(() => ({active: document.activeElement?.getAttribute('aria-label') || '', focusedText: document.querySelector('output')?.textContent || ''}))
const precondition = before.tags.length === 1 && before.tags[0] === 'tags.0' && before.emails.length === 0
const expected = variant === 'buggy' ? {tag: 'tags.0', email0: '', email1: ''} : {tag: 'tags.1', email0: 'emails.0', email1: 'emails.1'}
const relevantErrors = errors.filter(error => !/favicon|404/.test(error))
const observed = precondition && afterTag.active === expected.tag && afterEmail0.active === expected.email0 && afterEmail1.active === expected.email1 && relevantErrors.length === 0
const payload = {schema_version: '1.0', instance_id: 'ariakit__ariakit-6293', variant, precondition, before, afterTag, afterEmail0, afterEmail1, console_errors: relevantErrors, bug_observed: variant === 'buggy' ? observed : !observed, oracle_passed: observed, environment_valid: true, rendering_valid: true, trigger_valid: true, used_for_scoring: false}
await page.screenshot({path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: true})
const video = page.video(); await context.tracing.stop({path: path.join(outputDir, `${variant}-trace.zip`)}); await context.close(); if (video) { const src = await video.path(); fs.renameSync(src, path.join(outputDir, `${variant}-video.webm`)) }; await browser.close()
fs.writeFileSync(path.join(outputDir, 'observation.json'), JSON.stringify(payload, null, 2) + '\n')
console.log(JSON.stringify(payload))
if (!observed) process.exit(9)
