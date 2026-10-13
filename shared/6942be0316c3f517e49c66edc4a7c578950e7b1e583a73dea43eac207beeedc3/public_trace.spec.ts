import {expect, test} from "@playwright/test";
import {writeFile} from "node:fs/promises";
import {join} from "node:path";

test("FormPush focuses the newly created field", async ({page}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));
  await page.goto("/");
  await expect(page.getByRole("textbox", {name: "tags.0"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Add tag"})).toBeVisible();
  await expect(page.getByRole("button", {name: "Add email"})).toBeVisible();

  const before = await page.evaluate(() => ({
    tags: [...document.querySelectorAll<HTMLInputElement>('input[name^="tags."]')].map((input) => input.name),
    emails: [...document.querySelectorAll<HTMLInputElement>('input[name^="emails."]')].map((input) => input.name),
    active: document.activeElement?.getAttribute("aria-label") || "",
  }));
  await page.getByRole("button", {name: "Add tag"}).click();
  await expect(page.getByRole("textbox", {name: "tags.1"})).toBeVisible();
  const afterTag = await page.evaluate(() => ({active: document.activeElement?.getAttribute("aria-label") || "", focusedText: document.querySelector("output")?.textContent || ""}));
  await page.getByRole("button", {name: "Add email"}).click();
  await expect(page.getByRole("textbox", {name: "emails.0"})).toBeVisible();
  const afterEmail0 = await page.evaluate(() => ({active: document.activeElement?.getAttribute("aria-label") || "", focusedText: document.querySelector("output")?.textContent || ""}));
  await page.getByRole("button", {name: "Add email"}).click();
  await expect(page.getByRole("textbox", {name: "emails.1"})).toBeVisible();
  const afterEmail1 = await page.evaluate(() => ({active: document.activeElement?.getAttribute("aria-label") || "", focusedText: document.querySelector("output")?.textContent || ""}));

  const variant = process.env.REPRO_VARIANT || "unknown";
  const observation = {
    schema_version: "1.0", variant,
    precondition: {existingTagField: before.tags.length === 1 && before.tags[0] === "tags.0", emptyEmailArray: before.emails.length === 0, controlsVisible: true},
    before, afterTag, afterEmail0, afterEmail1, consoleErrors,
    subjectArtifactSha256: process.env.SUBJECT_ARTIFACT_SHA256 || null,
    verified: false, used_for_scoring: false,
  };
  if (variant === "buggy") {
    observation.verified = observation.precondition.existingTagField && observation.precondition.emptyEmailArray && afterTag.active === "tags.0" && afterEmail0.active === "" && afterEmail1.active === "" && consoleErrors.length === 0;
  } else if (variant === "gold") {
    observation.verified = observation.precondition.existingTagField && observation.precondition.emptyEmailArray && afterTag.active === "tags.1" && afterEmail0.active === "emails.0" && afterEmail1.active === "emails.1" && consoleErrors.length === 0;
  }
  const evidenceDir = process.env.REPRO_EVIDENCE_DIR || "test-results";
  await writeFile(join(evidenceDir, "observation.json"), JSON.stringify(observation, null, 2));
  await page.screenshot({path: join(evidenceDir, `${variant}-screenshot.png`)});
  expect(observation.verified, JSON.stringify(observation, null, 2)).toBe(true);
});
