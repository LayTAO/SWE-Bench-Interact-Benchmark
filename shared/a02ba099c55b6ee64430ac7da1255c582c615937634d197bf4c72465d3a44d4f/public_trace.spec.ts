import {expect, test} from "@playwright/test";
import {writeFile} from "node:fs/promises";
import {join} from "node:path";

async function state(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const combobox = document.querySelector<HTMLInputElement>("input[role=combobox]");
    const active = document.activeElement as HTMLElement | null;
    const listbox = document.querySelector<HTMLElement>("[role=listbox]");
    return {
      activeTag: active?.tagName || "",
      activeRole: active?.getAttribute("role") || "",
      activeLabel: active?.getAttribute("aria-label") || "",
      activeText: active?.textContent?.trim() || "",
      comboboxValue: combobox?.value || "",
      controlledValue: document.querySelector("#status")?.textContent || "",
      expanded: combobox?.getAttribute("aria-expanded") || "",
      activeDescendant: combobox?.getAttribute("aria-activedescendant") || "",
      panelOpen: !!listbox && getComputedStyle(listbox).display !== "none",
    };
  });
}

async function prepare(page: import("@playwright/test").Page) {
  await page.goto("/");
  const combobox = page.getByRole("combobox", {name: "Fruit"});
  const apple = page.getByRole("option", {name: "Apple"});
  await expect(combobox).toBeVisible();
  await combobox.click();
  await page.keyboard.type("b");
  await expect(page.locator("#status")).toHaveText("b");
  await page.keyboard.press("ArrowDown");
  await expect(apple).toBeFocused();
  await expect(combobox).toHaveValue("Apple");
  return {combobox, apple};
}

test("modifier shortcuts preserve item focus and combobox state", async ({page}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));
  const beforeRuns = [];
  const afterRuns = [];
  for (const shortcut of ["Control+C", "Meta+C"]) {
    await prepare(page);
    beforeRuns.push({shortcut, state: await state(page)});
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(25);
    afterRuns.push({shortcut, state: await state(page)});
  }
  const variant = process.env.REPRO_VARIANT || "unknown";
  const evidenceDir = process.env.REPRO_EVIDENCE_DIR || "test-results";
  await page.screenshot({path: join(evidenceDir, `${variant}-screenshot.png`), fullPage: true});

  await prepare(page);
  const beforePaste = await state(page);
  await page.keyboard.press("Control+V");
  await page.waitForTimeout(25);
  const afterPaste = await state(page);

  const observation = {
    schema_version: "1.0", variant,
    precondition: beforeRuns.every(({state: value}) => value.activeRole === "option" && value.activeText === "Apple" && value.controlledValue === "b" && value.expanded === "true" && value.panelOpen),
    beforeRuns, afterRuns, beforePaste, afterPaste, consoleErrors,
    subjectArtifactSha256: process.env.SUBJECT_ARTIFACT_SHA256 || null,
    verified: false, used_for_scoring: false,
  };
  const buggy = afterRuns.every(({state: value}) => value.activeRole !== "option" || value.activeText !== "Apple" || value.controlledValue !== "b");
  const gold = afterRuns.every(({state: value}) => value.activeRole === "option" && value.activeText === "Apple" && value.controlledValue === "b" && value.expanded === "true" && value.panelOpen);
  const pastePreserved = afterPaste.activeRole === "combobox" && afterPaste.panelOpen;
  observation.verified = observation.precondition && pastePreserved && (variant === "buggy" ? buggy : variant === "gold" ? gold : false) && consoleErrors.length === 0;
  await writeFile(join(evidenceDir, "observation.json"), JSON.stringify(observation, null, 2));
  expect(observation.verified, JSON.stringify(observation, null, 2)).toBe(true);
});
