import fs from 'node:fs'
import { expect, test } from '/tooling/node_modules/playwright/test.mjs'

test('Enter on a focused link inside wa-tree remains a link action', async ({ page, browserName }) => {
  const expectedBug = process.env.EXPECT_BUG === 'true'
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  const observation: Record<string, unknown> = {
    schema_version: '1.0', instance_id: 'shoelace-style__webawesome-2673', mode: process.env.REPRO_MODE,
    browser_name: browserName, browser_version: page.context().browser()?.version() ?? null,
    viewport: page.viewportSize(), workers: 1, retries: 0, environment_valid: false,
    rendering_valid: false, trigger_valid: false, bug_observed: false, action_error: null,
  }
  try {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => customElements.get('wa-tree') && document.querySelector('wa-tree')?.updateComplete)
    const fidelity = await page.locator('wa-tree').evaluate(tree => {
      const link = tree.querySelector('a')
      const treeRect = tree.getBoundingClientRect()
      const linkRect = link?.getBoundingClientRect()
      return { connected: tree.isConnected, linkVisible: !!link && !!(link.offsetWidth || link.offsetHeight), treeWidth: treeRect.width, treeHeight: treeRect.height, linkWidth: linkRect?.width ?? 0, linkHeight: linkRect?.height ?? 0 }
    })
    const tree = page.locator('wa-tree')
    await expect(tree).toBeVisible()
    const link = page.locator('#node-link')
    await expect(link).toBeVisible()
    let linkClicks = 0
    await link.evaluate(element => element.addEventListener('click', () => { window.__linkClicks = (window.__linkClicks || 0) + 1 }))
    await link.focus()
    const triggerValid = await link.evaluate(element => document.activeElement === element)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(100)
    linkClicks = await page.evaluate(() => window.__linkClicks || 0)
    const hash = await page.evaluate(() => location.hash)
    const selectedItems = await tree.evaluate(element => (element as any).selectedItems?.length ?? 0)
    const bugObserved = pageErrors.some(message => message.includes("Cannot read properties of undefined (reading 'disabled')")) || (linkClicks === 0 && hash === '')
    Object.assign(observation, {
      environment_valid: pageErrors.length === 0 && consoleErrors.length === 0 || bugObserved,
      rendering_valid: fidelity.connected && fidelity.linkVisible && fidelity.treeWidth > 0 && fidelity.treeHeight > 0 && fidelity.linkWidth > 0 && fidelity.linkHeight > 0,
      trigger_valid: triggerValid, bug_observed: bugObserved, fidelity, link_clicks: linkClicks, hash, selected_items: selectedItems,
    })
  } catch (error) {
    observation.action_error = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }
  Object.assign(observation, { page_errors: pageErrors, console_errors: consoleErrors })
  fs.mkdirSync('/results', { recursive: true })
  fs.writeFileSync('/results/observation.json', `${JSON.stringify(observation, null, 2)}\n`)
  expect(observation.action_error).toBeNull()
  expect(observation.rendering_valid).toBe(true)
  expect(observation.trigger_valid).toBe(true)
  expect(observation.bug_observed).toBe(expectedBug)
})
