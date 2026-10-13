import fs from 'node:fs'
import path from 'node:path'
import {expect, test} from '@playwright/test'

test('records pending Button Tooltip hover and focus behavior', async ({page}, testInfo) => {
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => consoleErrors.push(error.message))

  const evidenceDir = process.env.REPRO_EVIDENCE_DIR
    ?? path.resolve(testInfo.project.outputDir, '..', '..', 'evidence')
  fs.mkdirSync(evidenceDir, {recursive: true})

  await page.goto('/')
  const button = page.getByRole('button', {name: 'Pending action'})
  await expect(button).toBeVisible()
  const precondition = {
    button_visible: await button.isVisible(),
    pending_attribute: await button.getAttribute('data-pending'),
  }

  await page.mouse.move(12, 12)
  await page.waitForTimeout(100)
  await button.hover()
  await page.waitForTimeout(250)
  const pointerTooltipVisible = await page.getByRole('tooltip').isVisible()

  const variant = process.env.REPRO_VARIANT ?? 'run'
  const screenshotPath = path.join(evidenceDir, `${variant}-screenshot.png`)
  await page.screenshot({path: screenshotPath, fullPage: true})

  await page.mouse.move(12, 12)
  await button.focus()
  await page.waitForTimeout(250)
  const focusTooltipVisible = await page.getByRole('tooltip').isVisible()

  const payload = {
    schema_version: '1.0',
    variant,
    subject_artifact_sha256: process.env.SUBJECT_ARTIFACT_SHA256 ?? null,
    precondition,
    pointer_tooltip_visible: pointerTooltipVisible,
    focus_tooltip_visible: focusTooltipVisible,
    console_errors: consoleErrors,
    screenshot_path: screenshotPath,
    video_path: path.join(testInfo.outputDir, 'video.webm'),
    trace_path: path.join(testInfo.outputDir, 'trace.zip'),
    used_for_scoring: false,
  }
  fs.writeFileSync(
    path.join(evidenceDir, 'observation.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
  )
  console.log(JSON.stringify(payload, null, 2))
})
