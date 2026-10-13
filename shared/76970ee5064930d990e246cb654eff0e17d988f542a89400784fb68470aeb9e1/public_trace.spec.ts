import fs from 'node:fs'
import path from 'node:path'
import {expect, test} from '@playwright/test'

type Observation = {
  variant: string
  subject_artifact_sha256: string | null
  month_select_focused_before_type: boolean
  focus_on_month_select_after_type: boolean
  focus_in_calendar_grid_after_type: boolean
  active_role_after_type: string | null
  console_errors: string[]
  screenshot_path: string
  notes?: string[]
}

test('Month Select keeps focus when typing (gold) or loses it to grid (buggy)', async ({page}, testInfo) => {
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

  const monthButton = page.getByTestId('month-select-button')
  await expect(monthButton).toBeVisible()
  await monthButton.focus()
  await expect(monthButton).toBeFocused()

  const beforeFocused = await monthButton.evaluate((el) => el === document.activeElement)

  // Open Month Select, typeahead to January, commit — onSelectionChange calls setFocusedDate
  // (docs Month/Year picker pattern). Buggy steals focus into the grid; gold keeps Select focus.
  await monthButton.press('Enter')
  await page.keyboard.type('Jan')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)

  const after = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    const monthButtonEl = document.querySelector('[data-testid="month-select-button"]')
    const grid = document.querySelector('[role="grid"]')
    const inGrid = !!(active && grid && grid.contains(active))
    return {
      focus_on_month_select_after_type: active === monthButtonEl,
      focus_in_calendar_grid_after_type: inGrid,
      active_role_after_type: active?.getAttribute('role') ?? active?.tagName?.toLowerCase() ?? null
    }
  })

  const variant = process.env.REPRO_VARIANT ?? 'run'
  const screenshotPath = path.join(evidenceDir, `${variant}-screenshot.png`)
  await page.screenshot({path: screenshotPath, fullPage: true})

  const payload: Observation = {
    variant,
    subject_artifact_sha256: process.env.SUBJECT_ARTIFACT_SHA256 ?? null,
    month_select_focused_before_type: beforeFocused,
    focus_on_month_select_after_type: after.focus_on_month_select_after_type,
    focus_in_calendar_grid_after_type: after.focus_in_calendar_grid_after_type,
    active_role_after_type: after.active_role_after_type,
    console_errors: consoleErrors,
    screenshot_path: screenshotPath,
    notes: [
      'Expected buggy: focus moves into the calendar grid after setFocusedDate',
      'Expected gold: focus remains on the Month Select after setFocusedDate'
    ]
  }

  fs.writeFileSync(path.join(evidenceDir, 'observation.json'), `${JSON.stringify(payload, null, 2)}\n`)
  console.log(JSON.stringify(payload, null, 2))
})
