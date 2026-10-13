import fs from 'node:fs'
import path from 'node:path'
import {expect, test} from '@playwright/test'

test('observes input focus recovery after virtual option focus', async ({page}, testInfo) => {
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', error => consoleErrors.push(error.message))

  const evidenceDir = process.env.REPRO_EVIDENCE_DIR
    ?? path.resolve(testInfo.project.outputDir, '..', '..', 'evidence')
  fs.mkdirSync(evidenceDir, {recursive: true})

  if (process.env.STATIC_REPRO === '1') {
    const distDir = process.env.REPRO_DIST_DIR ?? path.resolve('dist')
    const nestedAssetsDir = path.join(distDir, 'assets')
    const assetsDir = fs.existsSync(nestedAssetsDir) ? nestedAssetsDir : distDir
    const assets = fs.readdirSync(assetsDir)
    const css = assets.find(file => file.endsWith('.css'))
    const js = assets.find(file => file.endsWith('.js'))
    if (!js) throw new Error('Static reproduction build is incomplete')
    await page.setContent('<!doctype html><html><head></head><body><div id="root"></div></body></html>')
    if (css) await page.addStyleTag({path: path.join(assetsDir, css)})
    await page.addScriptTag({path: path.join(assetsDir, js), type: 'module'})
    await page.getByTestId('repro-root').waitFor()
  } else {
    await page.goto('/')
  }

  const input = page.getByTestId('autocomplete-input')
  const option = page.getByRole('menuitem', {name: 'Rename symbol'})

  await input.click()
  await expect(input).toHaveAttribute('data-focused')

  await option.hover()
  await expect(option).toHaveAttribute('data-focused')
  await expect(input).not.toHaveAttribute('data-focused')
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/)

  await input.click()
  await page.waitForTimeout(150)

  const observation = await input.evaluate(element => {
    const focusedOption = document.querySelector('[role="menuitem"][data-focused]')
    return {
      document_active_element_is_input: document.activeElement === element,
      input_data_focused: element.hasAttribute('data-focused'),
      input_data_focus_visible: element.hasAttribute('data-focus-visible'),
      aria_activedescendant: element.getAttribute('aria-activedescendant'),
      focused_option: focusedOption?.textContent?.trim() ?? null,
      viewport: {width: window.innerWidth, height: window.innerHeight},
    }
  })

  const variant = process.env.REPRO_VARIANT ?? 'buggy'
  const screenshotPath = path.join(evidenceDir, `${variant}-screenshot.png`)
  await page.screenshot({path: screenshotPath, fullPage: true})

  const payload = {
    schema_version: '1.0',
    variant,
    subject_commit: process.env.SUBJECT_COMMIT ?? null,
    interaction: [
      'click autocomplete input',
      'hover Rename symbol option',
      'click the already-active autocomplete input again',
    ],
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
  expect(observation.document_active_element_is_input).toBe(true)
  if (variant === 'gold') {
    expect(observation.input_data_focused).toBe(true)
    expect(observation.aria_activedescendant).toBeNull()
    expect(observation.focused_option).toBeNull()
  } else {
    expect(observation.input_data_focused).toBe(false)
    expect(observation.aria_activedescendant).not.toBeNull()
    expect(observation.focused_option).toBe('Rename symbol')
  }
})
