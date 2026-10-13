import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [instanceId, variant, baseURL, outputDir] = process.argv.slice(2);
const executablePath = process.env.CHROMIUM_EXECUTABLE;
if (!instanceId || !variant || !baseURL || !outputDir || !executablePath) {
  throw new Error(
    'usage: capture.mjs <instance> <buggy|gold> <base-url> <output-dir>; CHROMIUM_EXECUTABLE is required',
  );
}

fs.mkdirSync(outputDir, { recursive: true });
const videoDir = path.join(outputDir, '.video');
fs.mkdirSync(videoDir, { recursive: true });
const consoleErrors = [];
const pageErrors = [];
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const chromiumVersion = browser.version();
const context = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  recordVideo: { dir: videoDir, size: { width: 1024, height: 768 } },
});
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const page = await context.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

let measured = {};
let actionError = null;
try {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

  if (instanceId === 'IR-M-131') {
    const trigger = page.getByText('Right Click Here', { exact: true });
    await trigger.waitFor({ state: 'visible', timeout: 30_000 });
    await page.evaluate(() => {
      window.__irContextMenuEvents = [];
      document.addEventListener(
        'contextmenu',
        (event) => {
          queueMicrotask(() => {
            window.__irContextMenuEvents.push({
              defaultPrevented: event.defaultPrevented,
              targetText: event.target?.textContent ?? null,
            });
          });
        },
        false,
      );
    });

    await trigger.click({ button: 'right' });
    const submenuTrigger = page.getByText('Bookmarks →', { exact: true });
    await submenuTrigger.hover();
    const inbox = page.getByText('Inbox', { exact: true });
    await inbox.waitFor({ state: 'visible' });
    const inboxVisibleBeforeSecondClick = await inbox.isVisible();

    await trigger.click({ button: 'right', force: true });
    const rootItem = page.getByText('New Tab', { exact: true });
    await page.waitForTimeout(500);
    const events = await page.evaluate(() => window.__irContextMenuEvents);
    const secondEvent = events.at(-1) ?? null;
    const rootMenuVisible = await rootItem.isVisible().catch(() => false);
    const inboxVisibleAfterSecondClick = await inbox.isVisible().catch(() => false);
    measured = {
      inbox_visible_before_second_click: inboxVisibleBeforeSecondClick,
      second_contextmenu_default_prevented: secondEvent?.defaultPrevented ?? null,
      root_menu_visible_after_second_click: rootMenuVisible,
      inbox_visible_after_second_click: inboxVisibleAfterSecondClick,
      contextmenu_events: events,
    };
    measured.oracle_passed =
      inboxVisibleBeforeSecondClick &&
      secondEvent?.defaultPrevented === true &&
      rootMenuVisible &&
      !inboxVisibleAfterSecondClick;
  } else if (instanceId === 'IR-M-122') {
    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 30_000 });
    await listbox.evaluate((element) => {
      element.scrollTop = 50;
    });
    const before = await listbox.evaluate((element) => element.scrollTop);
    await page.getByRole('button', { name: 'Append options', exact: true }).click();
    await page.waitForTimeout(100);
    const after = await page.getByRole('listbox').evaluate((element) => element.scrollTop);
    const optionCount = await page.getByRole('option').count();
    measured = {
      scroll_top_before_append: before,
      scroll_top_after_append: after,
      option_count_after_append: optionCount,
    };
    measured.oracle_passed = before === 50 && after === 50 && optionCount === 8;
  } else if (instanceId === 'IR-M-123') {
    const textbox = page.getByRole('combobox');
    await textbox.waitFor({ state: 'visible', timeout: 30_000 });
    await textbox.click();
    await textbox.click();
    await textbox.click();
    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible' });
    await listbox.evaluate((element) => element.scrollBy(0, 180));
    const before = await listbox.evaluate((element) => element.scrollTop);
    await page.getByRole('option', { name: 'five', exact: true }).click();
    await page.waitForTimeout(100);
    const after = await page.getByRole('listbox').evaluate((element) => element.scrollTop);
    measured = {
      scroll_top_before_select: before,
      scroll_top_after_select: after,
    };
    measured.oracle_passed = before > 0 && after > 0;
  } else if (instanceId === 'IR-M-120') {
    const input = page.getByTestId('tag-picker-input');
    await input.waitFor({ state: 'visible', timeout: 30_000 });
    await input.click();
    await input.fill('SomeText');
    await input.press('Backspace');
    const valueBeforeSelectAll = await input.inputValue();
    await input.press('Control+A');
    await input.press('Backspace');
    await page.waitForTimeout(100);
    const valueAfterBackspace = await input.inputValue();
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') ?? null,
    );
    const lastTagFocused =
      activeTestId === 'tag--Maria Rossi';
    measured = {
      value_before_select_all: valueBeforeSelectAll,
      value_after_selected_backspace: valueAfterBackspace,
      active_element_testid: activeTestId,
      last_tag_focused: lastTagFocused,
    };
    measured.oracle_passed =
      valueBeforeSelectAll === 'SomeTex' &&
      valueAfterBackspace === '' &&
      activeTestId === 'tag-picker-input' &&
      !lastTagFocused;
  } else if (instanceId === 'IR-M-143') {
    const activator = page.getByRole('button', { name: 'Open popover', exact: true });
    await activator.waitFor({ state: 'visible', timeout: 30_000 });
    await activator.click();
    const action = page.getByRole('button', { name: 'Popover action', exact: true });
    await action.waitFor({ state: 'visible' });
    const activeBeforeEscape = await page.evaluate(() => document.activeElement?.id ?? null);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const activeAfterEscape = await page.evaluate(() => document.activeElement?.id ?? null);
    const popoverVisibleAfterEscape = await action.isVisible().catch(() => false);
    measured = {
      active_element_before_escape: activeBeforeEscape,
      active_element_after_escape: activeAfterEscape,
      popover_visible_after_escape: popoverVisibleAfterEscape,
    };
    measured.oracle_passed =
      !popoverVisibleAfterEscape && activeAfterEscape === 'focus-target';
  } else if (instanceId === 'IR-M-140') {
    const visibleCount = async (locator) => {
      let count = 0;
      for (const item of await locator.all()) {
        if (await item.isVisible().catch(() => false)) count += 1;
      }
      return count;
    };
    const cascaderInput = page.locator('[data-testid="cascader"] input');
    await cascaderInput.waitFor({ state: 'visible', timeout: 30_000 });
    await cascaderInput.click();
    const zhejiang = page.getByText('Zhejiang', { exact: true });
    await zhejiang.waitFor({ state: 'visible' });
    await zhejiang.click();
    const hangzhou = page.getByText('Hangzhou', { exact: true });
    await hangzhou.waitFor({ state: 'visible' });
    await hangzhou.click();
    await page.getByText('West Lake', { exact: true }).waitFor({ state: 'visible' });
    const columnsBeforeCancel = await visibleCount(page.locator('.ant-cascader-menu'));
    await cascaderInput.press('Escape');
    await page.waitForTimeout(100);
    const popupVisibleAfterCancel =
      (await visibleCount(page.locator('.ant-cascader-menus'))) > 0;
    await page.getByRole('button', { name: 'Snapshot columns', exact: true }).click();
    const retainedColumns = Number(
      await page.locator('#retained-columns').textContent(),
    );
    await cascaderInput.click();
    await zhejiang.waitFor({ state: 'visible' });
    const columnsAfterReopen = await visibleCount(page.locator('.ant-cascader-menu'));
    measured = {
      columns_before_cancel: columnsBeforeCancel,
      popup_visible_after_cancel: popupVisibleAfterCancel,
      retained_columns_after_cancel: retainedColumns,
      visible_columns_after_reopen: columnsAfterReopen,
    };
    measured.oracle_passed =
      columnsBeforeCancel === 3 &&
      !popupVisibleAfterCancel &&
      retainedColumns === 1 &&
      columnsAfterReopen === 1;
  } else {
    throw new Error(`unsupported instance ${instanceId}`);
  }
} catch (error) {
  actionError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  measured = { ...measured, oracle_passed: false };
}

await page
  .evaluate(
    ({ instanceId, variant, measured, actionError }) => {
      const output = document.createElement('pre');
      output.id = 'oracle-observation';
      output.dataset.oraclePassed = String(measured.oracle_passed);
      output.style.cssText =
        'position:fixed;left:8px;bottom:8px;max-width:1008px;max-height:250px;overflow:auto;z-index:2147483647;background:#111;color:#fff;padding:10px;font:12px monospace;white-space:pre-wrap';
      output.textContent = JSON.stringify({ instanceId, variant, measured, actionError }, null, 2);
      document.body.appendChild(output);
    },
    { instanceId, variant, measured, actionError },
  )
  .catch(() => {});

const screenshot = path.join(outputDir, `${variant}-screenshot.png`);
await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
const video = page.video();
await context.tracing.stop({ path: path.join(outputDir, `${variant}-trace.zip`) });
await page.close();
await context.close();
if (video) {
  const source = await video.path().catch(() => null);
  if (source && fs.existsSync(source)) {
    fs.renameSync(source, path.join(outputDir, `${variant}-video.webm`));
  }
}
await browser.close();

const observation = {
  instance_id: instanceId,
  variant,
  action_error: actionError,
  console_errors: consoleErrors,
  page_errors: pageErrors,
  chromium_version: chromiumVersion,
  chromium_executable: executablePath,
  viewport: { width: 1024, height: 768 },
  workers: 1,
  retries: 0,
  used_for_scoring: false,
  ...measured,
};
fs.writeFileSync(
  path.join(outputDir, 'observation.json'),
  `${JSON.stringify(observation, null, 2)}\n`,
);
console.log(JSON.stringify(observation));
// The browser version is retained in observation.json for provenance.  The
// verifier image is already frozen by digest, so a mutable upstream
// Playwright tag must not turn an otherwise valid interaction into a
// canonical failure merely because its bundled Chromium version changed.
