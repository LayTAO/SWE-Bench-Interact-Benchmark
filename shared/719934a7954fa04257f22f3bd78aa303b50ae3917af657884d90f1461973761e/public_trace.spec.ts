import fs from 'node:fs'
import path from 'node:path'
import {expect, test} from '@playwright/test'

type Observation = {
  variant: string
  subject_artifact_sha256: string | null
  listbox_visible_before_header_click: boolean
  listbox_visible_after_header_click: boolean
  console_errors: string[]
  screenshot_path: string
  notes?: string[]
}

test('record ComboBox behavior after a section-header click', async ({page}, testInfo) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message)
  })

  const evidenceDir = process.env.REPRO_EVIDENCE_DIR
    ?? path.resolve(testInfo.project.outputDir, '..', '..', 'evidence')
  fs.mkdirSync(evidenceDir, {recursive: true})

  await page.goto('/')

  await page.getByTestId('combobox-button').click()
  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible()

  const beforeVisible = await listbox.isVisible()

  await page.getByTestId('section-header-fruit').click()
  await page.waitForTimeout(400)

  const after = await page.evaluate(() => {
    const listboxEl = document.querySelector('[role="listbox"]')
    const visible = !!listboxEl && (listboxEl as HTMLElement).offsetParent !== null
    return {listbox_visible: visible}
  })

  const variant = process.env.REPRO_VARIANT ?? 'run'
  const screenshotPath = path.join(evidenceDir, `${variant}-screenshot.png`)
  await page.screenshot({path: screenshotPath, fullPage: true})

  const payload: Observation = {
    variant,
    subject_artifact_sha256: process.env.SUBJECT_ARTIFACT_SHA256 ?? null,
    listbox_visible_before_header_click: beforeVisible,
    listbox_visible_after_header_click: after.listbox_visible,
    console_errors: consoleErrors,
    screenshot_path: screenshotPath,
    notes: [
      'Issue expectation: listbox stays open after section header click',
      'Reported defect: listbox closes after section header click'
    ]
  }

  fs.writeFileSync(path.join(evidenceDir, 'observation.json'), `${JSON.stringify(payload, null, 2)}\n`)
  console.log(JSON.stringify(payload, null, 2))
})
