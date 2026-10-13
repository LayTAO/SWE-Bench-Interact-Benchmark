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
await page.evaluate(() => {
  const events = []
  const record = (type, event) => events.push({type, time: performance.now(), propertyName: event?.propertyName ?? null})
  const onTransitionRun = event => record('transitionrun', event)
  const onTransitionEnd = event => record('transitionend', event)
  const onTransitionCancel = event => record('transitioncancel', event)
  document.addEventListener('transitionrun', onTransitionRun, true)
  document.addEventListener('transitionend', onTransitionEnd, true)
  document.addEventListener('transitioncancel', onTransitionCancel, true)
  const observer = new MutationObserver(records => {
    for (const mutation of records) {
      for (const node of mutation.removedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node.id === 'detached-transition') {
          events.push({type: 'detached', time: performance.now()})
        }
      }
    }
  })
  observer.observe(document, {subtree: true, childList: true})
  window.__interactRepairTransitionEvidence = {
    events,
    cleanup: () => {
      observer.disconnect()
      document.removeEventListener('transitionrun', onTransitionRun, true)
      document.removeEventListener('transitionend', onTransitionEnd, true)
      document.removeEventListener('transitioncancel', onTransitionCancel, true)
    },
  }
})
await page.getByRole('button', {name: 'Run detached transition'}).click()
const observation = await page.evaluate(async () => {
  const state = window.__interactRepairTransitionEvidence
  const frameSamples = []
  let callbackFrame = null
  for (let frame = 0; frame < 180; frame++) {
    const callbackStatus = document.querySelector('#callback-status')?.textContent?.trim() || ''
    frameSamples.push({
      frame,
      time: performance.now(),
      callback_status: callbackStatus,
      detached_element_count: document.querySelectorAll('#detached-transition').length,
    })
    if (callbackStatus === 'callback fired') {
      callbackFrame = frame
      break
    }
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  const callbackStatus = document.querySelector('#callback-status')?.textContent?.trim() || ''
  const detachedElementCount = document.querySelectorAll('#detached-transition').length
  const events = state?.events ?? []
  state?.cleanup()
  return {
    callback_status: callbackStatus,
    detached_element_count: detachedElementCount,
    transition_events: events,
    frame_samples: frameSamples,
    callback_frame: callbackFrame,
    transitionrun_count: events.filter(event => event.type === 'transitionrun').length,
    detached_event_count: events.filter(event => event.type === 'detached').length,
  }
})
const relevantErrors = errors.filter(error => !/favicon|404/.test(error))
const environmentValid = await page.getByRole('button', {name: 'Run detached transition'}).count() === 1
const triggerValid = observation.transitionrun_count >= 1 && observation.detached_event_count >= 1 && observation.detached_element_count === 0
const oraclePassed = environmentValid && triggerValid && relevantErrors.length === 0 && (variant === 'buggy' ? observation.callback_status === 'waiting' : observation.callback_status === 'callback fired')
await page.screenshot({path: path.join(outputDir, `${variant}-screenshot.png`), fullPage: true})
const video = page.video()
await context.tracing.stop({path: path.join(outputDir, `${variant}-trace.zip`)})
await context.close()
if (video) fs.renameSync(await video.path(), path.join(outputDir, `${variant}-video.webm`))
await browser.close()
const payload = {schema_version: '1.0', instance_id: 'adobe__react-spectrum-7973', interaction: 'Click Run detached transition after dispatching and detaching a transition target', variant, ...observation, console_errors: relevantErrors, environment_valid: environmentValid, rendering_valid: true, trigger_valid: triggerValid, oracle_passed: oraclePassed, bug_observed: variant === 'buggy' ? oraclePassed : !oraclePassed, used_for_scoring: false}
fs.writeFileSync(path.join(outputDir, 'observation.json'), `${JSON.stringify(payload, null, 2)}\n`)
console.log(JSON.stringify(payload))
if (!oraclePassed) process.exit(9)
