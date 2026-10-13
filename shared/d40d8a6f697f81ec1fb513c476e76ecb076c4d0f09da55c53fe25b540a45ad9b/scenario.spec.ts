import fs from 'node:fs'
import { expect, test } from '/tooling/node_modules/playwright/test.mjs'

test('VAutocomplete keeps its menu open while scrolling the virtualized list', async ({ page, browserName }) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message))
  const observation: Record<string, unknown> = {
    schema_version: '1.0',
    instance_id: 'vuetifyjs__vuetify-22850',
    mode: process.env.REPRO_MODE,
    browser_name: browserName,
    browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(),
    workers: 1,
    retries: 0,
    environment_valid: false,
    rendering_valid: false,
    trigger_valid: false,
    bug_observed: false,
    action_error: null,
  }

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.locator('#oracle-ready').waitFor({ state: 'attached', timeout: 30_000 })
    const field = page.getByTestId('autocomplete').locator('input')
    const fieldRoot = page.getByTestId('autocomplete')
    const listbox = page.locator('[role="listbox"]').first()
    await expect(field).toBeVisible()
    const fieldRect = await field.boundingBox()
    if (!fieldRect) throw new Error('autocomplete input has no bounding box')
    const fieldRootRect = await fieldRoot.boundingBox()
    if (!fieldRootRect) throw new Error('autocomplete component has no bounding box')

    await field.click()
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    const overlay = page.locator('.v-overlay--active').first()
    const overlayRect = await overlay.boundingBox()
    const listCandidates = page.locator('.v-overlay__content .v-virtual-scroll, .v-overlay__content [role="listbox"]')
    let scrollTarget = listbox
    let scrollMetrics: {clientHeight: number, scrollHeight: number, scrollTop: number} | null = null
    for (let index = 0; index < await listCandidates.count(); index += 1) {
      const candidate = listCandidates.nth(index)
      if (!(await candidate.isVisible().catch(() => false))) continue
      const metrics = await candidate.evaluate(element => ({
        clientHeight: (element as HTMLElement).clientHeight,
        scrollHeight: (element as HTMLElement).scrollHeight,
        scrollTop: (element as HTMLElement).scrollTop,
      }))
      if (metrics.scrollHeight > metrics.clientHeight) {
        scrollTarget = candidate
        scrollMetrics = metrics
        break
      }
    }
    if (!scrollMetrics) throw new Error('visible list has no scrollable target')
    const targetRect = await scrollTarget.boundingBox()
    if (!targetRect) throw new Error('scroll target has no bounding box')

    await scrollTarget.evaluate(element => {
      const state = { events: 0, maxScrollTop: 0 }
      ;(window as any).__interactrepairScroll = state
      element.addEventListener('scroll', () => {
        state.events += 1
        state.maxScrollTop = Math.max(state.maxScrollTop, (element as HTMLElement).scrollTop)
      }, { passive: true })
    })
    const initiallyVisible = await listbox.isVisible()
    const menuOpenBefore = await overlay.isVisible().catch(() => false)
    await page.mouse.move(targetRect.x + targetRect.width / 2, targetRect.y + Math.min(targetRect.height / 2, 40))
    for (let index = 0; index < 8; index += 1) await page.mouse.wheel(0, 280)
    await expect.poll(() => page.evaluate(() => (window as any).__interactrepairScroll?.events ?? 0), { timeout: 3_000 }).toBeGreaterThan(0)
    const scrollState = await page.evaluate(() => (window as any).__interactrepairScroll)
    const menuOpenAfterScroll = await overlay.isVisible().catch(() => false) && await listbox.isVisible().catch(() => false)
    const renderingValid = fieldRootRect.width >= 220 && fieldRootRect.height >= 48 &&
      !!overlayRect && overlayRect.width >= 220 && overlayRect.height >= 100 &&
      targetRect.width >= 220 && targetRect.height >= 80 &&
      scrollMetrics.scrollHeight > scrollMetrics.clientHeight + 20
    const triggerValid = initiallyVisible === true && menuOpenBefore === true &&
      scrollState.events > 0 && scrollState.maxScrollTop > 0
    const environmentValid = pageErrors.length === 0
    Object.assign(observation, {
      environment_valid: environmentValid,
      rendering_valid: renderingValid,
      trigger_valid: triggerValid,
      bug_observed: environmentValid && renderingValid && triggerValid && !menuOpenAfterScroll,
      initially_visible: initiallyVisible,
      menu_open_before_scroll: menuOpenBefore,
      menu_open_after_scroll: menuOpenAfterScroll,
      scroll_triggered: scrollState.events > 0,
      scroll_state: scrollState,
      controls: { field: fieldRect, field_root: fieldRootRect, overlay: overlayRect, target: targetRect, metrics: scrollMetrics },
    })
  } catch (error) {
    observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }
  Object.assign(observation, { console_errors: consoleErrors, page_errors: pageErrors })
  fs.mkdirSync('/results', { recursive: true })
  fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  await page.screenshot({ path: `/results/${process.env.REPRO_MODE}-screenshot.png`, fullPage: true }).catch(() => {})
  expect(observation.action_error).toBeNull()
  expect(observation.environment_valid).toBe(true)
  expect(observation.rendering_valid).toBe(true)
  expect(observation.trigger_valid).toBe(true)
  expect(observation.bug_observed).toBe(expectedBug)
})
