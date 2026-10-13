import fs from 'node:fs'
import path from 'node:path'
import {expect, test} from 'playwright/test'

test('records ColorPicker outside-click value commit', async ({page}, testInfo) => {
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => consoleErrors.push(error.message))

  const evidenceDir = process.env.REPRO_EVIDENCE_DIR
    ?? path.resolve(testInfo.project.outputDir, '..', '..', 'evidence')
  fs.mkdirSync(evidenceDir, {recursive: true})

  await page.goto('/')
  const pickerButton = page.getByRole('button', {name: 'Fill'})
  await expect(pickerButton).toBeVisible()
  const swatchBefore = await pickerButton.locator('[aria-label]').first().getAttribute('aria-label')

  await pickerButton.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const hex = page.getByRole('textbox', {name: 'Hex'})
  await expect(hex).toBeVisible()
  await hex.fill('111111')
  const typedValue = (await hex.inputValue()).replace(/^#/, '')

  // The underlay intentionally covers the inert page; dispatch a real pointer
  // at a viewport coordinate outside the popover rather than clicking the
  // inert page content through it.
  await page.mouse.click(1200, 100)
  await page.waitForTimeout(1000)
  const popoverClosed = await page.getByRole('dialog').count() === 0
  const swatchAfter = await pickerButton.locator('[aria-label]').first().getAttribute('aria-label')
  const committed = swatchAfter !== swatchBefore

  const variant = process.env.REPRO_VARIANT ?? 'run'
  const screenshotPath = path.join(evidenceDir, `${variant}-screenshot.png`)
  await page.screenshot({path: screenshotPath, fullPage: true})
  const payload = {
    schema_version: '1.0',
    variant,
    subject_artifact_sha256: process.env.SUBJECT_ARTIFACT_SHA256 ?? null,
    precondition: {
      picker_button_visible: await pickerButton.isVisible(),
      swatch_before: swatchBefore,
    },
    popover_opened: true,
    typed_value: typedValue,
    popover_closed: popoverClosed,
    swatch_before: swatchBefore,
    swatch_after: swatchAfter,
    committed,
    console_errors: consoleErrors,
    screenshot_path: screenshotPath,
    video_path: path.join(testInfo.outputDir, 'video.webm'),
    trace_path: path.join(testInfo.outputDir, 'trace.zip'),
    used_for_scoring: false,
  }
  fs.writeFileSync(path.join(evidenceDir, 'observation.json'), `${JSON.stringify(payload, null, 2)}\n`)
  console.log(JSON.stringify(payload, null, 2))
})
