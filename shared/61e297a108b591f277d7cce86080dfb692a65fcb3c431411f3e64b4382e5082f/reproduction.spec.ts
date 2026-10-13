import fs from 'node:fs'
import path from 'node:path'
import {expect, test} from '@playwright/test'

test('observes Popover placement with Menu plus extra content', async ({page}, testInfo) => {
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => consoleErrors.push(error.message))

  const evidenceDir = process.env.REPRO_EVIDENCE_DIR
    ?? path.resolve(testInfo.project.outputDir, '..', '..', 'evidence')
  fs.mkdirSync(evidenceDir, {recursive: true})

  if (process.env.STATIC_REPRO === '1') {
    const assetsDir = path.resolve('dist/assets')
    const assets = fs.readdirSync(assetsDir)
    const css = assets.find(file => file.endsWith('.css'))
    const js = assets.find(file => file.endsWith('.js'))
    if (!css || !js) throw new Error('Static reproduction build is incomplete')
    await page.setContent('<!doctype html><html><head></head><body><div id="root"></div></body></html>')
    await page.addStyleTag({path: path.join(assetsDir, css)})
    await page.addScriptTag({path: path.join(assetsDir, js), type: 'module'})
    await page.getByTestId('repro-root').waitFor()
  } else {
    await page.goto('/')
  }
  const trigger = page.getByRole('button', {name: 'Open popover'})
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox).not.toBeNull()
  expect(triggerBox!.y + triggerBox!.height).toBeGreaterThan(470)

  await trigger.click()
  const popover = page.getByTestId('popover')
  await popover.waitFor({state: 'visible'})

  const observation = await popover.evaluate(element => {
    const rect = element.getBoundingClientRect()
    const extra = element.querySelector('[data-testid="extra-content"]')
    const extraRect = extra?.getBoundingClientRect()
    return {
      placement: element.getAttribute('data-placement'),
      popover: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        scrollHeight: (element as HTMLElement).scrollHeight,
        clientHeight: (element as HTMLElement).clientHeight,
      },
      extra: extraRect
        ? {top: extraRect.top, bottom: extraRect.bottom, height: extraRect.height}
        : null,
      viewport: {width: window.innerWidth, height: window.innerHeight},
    }
  })

  const screenshotPath = path.join(
    evidenceDir,
    `${process.env.REPRO_VARIANT ?? 'run'}-screenshot.png`,
  )
  await page.screenshot({path: screenshotPath, fullPage: true})

  const variant = process.env.REPRO_VARIANT ?? 'run'
  const fullyVisible = observation.popover.top >= 0
    && observation.popover.bottom <= observation.viewport.height
    && observation.extra !== null
    && observation.extra.bottom <= observation.viewport.height
    && observation.popover.scrollHeight <= observation.popover.clientHeight
  const payload = {
    schema_version: '1.0',
    variant,
    subject_commit: process.env.SUBJECT_COMMIT ?? null,
    fully_visible: fullyVisible,
    trigger: triggerBox,
    ...observation,
    console_errors: consoleErrors,
    screenshot_path: screenshotPath,
    trace_path: path.join(testInfo.outputDir, 'trace.zip'),
    video_path: path.join(testInfo.outputDir, 'video.webm'),
    used_for_scoring: false,
  }
  fs.writeFileSync(
    path.join(evidenceDir, 'observation.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
  )

  expect(consoleErrors).toEqual([])
})
