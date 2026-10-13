import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [instanceId, variant, baseURL, evidenceDir] = process.argv.slice(2);
if (!instanceId || !variant || !baseURL || !evidenceDir) {
  throw new Error("usage: capture_ariakit.mjs <instance> <variant> <base-url> <evidence-dir>");
}

const executablePath = process.env.CHROMIUM_EXECUTABLE;
if (!executablePath) throw new Error("CHROMIUM_EXECUTABLE is required");

fs.mkdirSync(evidenceDir, { recursive: true });
const videoDir = path.join(evidenceDir, ".video");
fs.mkdirSync(videoDir, { recursive: true });
const consoleErrors = [];
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 960, height: 600 },
  recordVideo: { dir: videoDir, size: { width: 960, height: 600 } },
});
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const page = await context.newPage();
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

let observation;
if (instanceId === "IR-M-057") {
  await page.goto(`${baseURL}/previews/select-menu-default-open`, { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);
  await page.getByRole("button", { name: "Filters (0)" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Language" }).click();
  await page.waitForTimeout(400);
  const menuVisible = await page.getByRole("menu").isVisible().catch(() => false);
  const listboxVisible = await page.getByRole("listbox", { name: "Language:" }).isVisible().catch(() => false);
  const filterCount = await page.getByRole("button", { name: /Filters \(\d+\)/ }).textContent();
  const activeRole = await page.evaluate(() => document.activeElement?.getAttribute("role") ?? null);
  observation = {
    action: "Open Filters and add the Language filter",
    menu_visible_after_selection: menuVisible,
    language_listbox_visible: listboxVisible,
    filter_button_text: filterCount,
    active_element_role: activeRole,
    oracle_passed: !menuVisible && listboxVisible && filterCount === "Filters (1)",
  };
} else if (instanceId === "IR-M-058") {
  await page.goto(`${baseURL}/previews/dialog-nested-multiple`, { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);
  await page.getByRole("button", { name: "Open dialog" }).click();
  await page.getByRole("button", { name: "nested unmount", exact: true }).click();
  await page.getByRole("button", { name: "nested unmount nested", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const inertElements = await page.locator("[inert]").count();
  const visibleDialogsAfterClose = await page.getByRole("dialog").count();
  let reopened = false;
  try {
    await page.getByRole("button", { name: "Open dialog" }).click({ timeout: 2500 });
    reopened = await page.getByRole("dialog").isVisible();
  } catch {
    reopened = false;
  }
  observation = {
    action: "Open three dynamically mounted dialogs, close all with Escape, and reopen",
    inert_element_count_after_close: inertElements,
    visible_dialog_count_after_close: visibleDialogsAfterClose,
    root_dialog_reopened: reopened,
    oracle_passed: inertElements === 0 && visibleDialogsAfterClose === 0 && reopened,
  };
} else if (instanceId === "IR-M-059") {
  await page.goto(`${baseURL}/previews/dialog-nested-multiple`, { waitUntil: "networkidle" });
  // Make the scroll-lock precondition explicit. The upstream Playwright test
  // assumes a scrollable preview page before checking whether a modal prevents
  // a wheel scroll.
  await page.evaluate(() => { document.body.style.minHeight = "200vh"; });
  await page.getByRole("button", { name: "Open dialog" }).click();
  await page.getByRole("button", { name: "sibling dismiss animated", exact: true }).click();
  const replacement = page.getByRole("dialog", { name: "sibling dismiss animated", exact: true });
  await replacement.waitFor({ state: "visible" });
  await page.getByRole("button", { name: "sibling dismiss animated sibling", exact: true }).click();
  const topmost = page.getByRole("dialog", { name: "sibling dismiss animated sibling", exact: true });
  await topmost.waitFor({ state: "visible" });
  const dialogVisible = await topmost.isVisible();
  const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
  const bodyPaddingRight = await page.evaluate(() => getComputedStyle(document.body).paddingRight);
  await page.mouse.move(1, 1);
  const scrollYBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(150);
  const scrollYAfter = await page.evaluate(() => window.scrollY);
  const bodyScrolled = scrollYAfter !== scrollYBefore;
  observation = {
    action: "Move twice between animated sibling dialogs while retaining scroll lock",
    replacement_dialog_visible: dialogVisible,
    body_overflow: bodyOverflow,
    body_padding_right: bodyPaddingRight,
    scroll_y_before_wheel: scrollYBefore,
    scroll_y_after_wheel: scrollYAfter,
    body_scrolled_while_dialog_open: bodyScrolled,
    oracle_passed: dialogVisible && !bodyScrolled,
  };
} else if (instanceId === "IR-M-062") {
  await page.goto(`${baseURL}/react/previews/combobox-ime-6663/`, { waitUntil: "networkidle" });
  const combobox = page.getByRole("combobox", { name: "Fruit" });
  const cdp = await context.newCDPSession(page);
  await combobox.focus();
  await page.evaluate(() => {
    window.__interactRepairImeEvents = [];
    for (const type of ["compositionstart", "compositionend", "focusin"]) {
      document.addEventListener(type, (event) => {
        const target = event.target;
        window.__interactRepairImeEvents.push({
          type,
          data: event instanceof CompositionEvent ? event.data : undefined,
          role: target instanceof HTMLElement ? target.getAttribute("role") : null,
        });
      }, true);
    }
  });
  const compose = (text) => cdp.send("Input.imeSetComposition", {
    text,
    selectionStart: text.length,
    selectionEnd: text.length,
  });
  await compose("ㅅ");
  await compose("사");
  await compose("삭");
  await compose("사");
  await Promise.all([
    cdp.send("Input.insertText", { text: "사" }),
    compose("고"),
  ]);
  const focusTrace = await page.evaluate(() => {
    const events = window.__interactRepairImeEvents ?? [];
    const end = events.findIndex((event) => event.type === "compositionend" && event.data === "사");
    const start = events.findIndex((event, index) => index > end && event.type === "compositionstart");
    const movedToOption = end >= 0 && start > end && events.slice(end + 1, start)
      .some((event) => event.type === "focusin" && event.role === "option");
    return { end, start, movedToOption, events };
  });
  await compose("과");
  await cdp.send("Input.insertText", { text: "과" });
  const inputValue = await combobox.inputValue();
  observation = {
    action: "Replay the Korean IME composition boundary for 사과 with autoSelect enabled",
    input_value: inputValue,
    focus_moved_to_option_between_compositions: focusTrace.movedToOption,
    ime_events: focusTrace.events,
    oracle_passed: !focusTrace.movedToOption && inputValue === "사과",
  };
} else {
  throw new Error(`unsupported Ariakit instance ${instanceId}`);
}

await page.screenshot({ path: path.join(evidenceDir, `${variant}-screenshot.png`), fullPage: true });
await page.waitForTimeout(500);
const video = page.video();
await context.tracing.stop({ path: path.join(evidenceDir, `${variant}-trace.zip`) });
await context.close();
if (video) {
  const source = await video.path();
  fs.renameSync(source, path.join(evidenceDir, `${variant}-video.webm`));
}
await browser.close();

const payload = {
  schema_version: "1.0",
  instance_id: instanceId,
  variant,
  chromium_version: "145.0.7632.6",
  chromium_executable: executablePath,
  viewport: { width: 960, height: 600 },
  workers: 1,
  retries: 0,
  used_for_scoring: false,
  ...observation,
  console_errors: consoleErrors,
};
fs.writeFileSync(path.join(evidenceDir, "observation.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload, null, 2));
