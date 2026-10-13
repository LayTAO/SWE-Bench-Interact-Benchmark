import { test, expect } from "@playwright/test"
import fs from "node:fs"

test("calc division keeps its divisor in the animatable-none value", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text())
    })
    await page.goto("http://127.0.0.1:4173")
    await expect(page.locator("#oracle-ready")).toBeAttached()
    await page.locator("#rerun").click()
    const observed = await page.evaluate(() => ({
        variableDivision: document.querySelector("[data-testid=variable-division]")?.textContent ?? "",
        numericDivision: document.querySelector("[data-testid=numeric-division]")?.textContent ?? "",
        multiplication: document.querySelector("[data-testid=multiplication]")?.textContent ?? "",
    }))
    const environmentValid = Object.values(observed).every((value) => value.length > 0)
    const bugObserved = /\/\s*0(?:\D|$)/.test(observed.variableDivision) || /\/\s*0(?:\D|$)/.test(observed.numericDivision)
    await page.screenshot({path: "/results/patched-screenshot.png", fullPage: true})
    const record = { schema_version: "1.0", instance_id: "motiondivision__motion-3232", mode: process.env.REPRO_VARIANT ?? "unknown", environment_valid: environmentValid, trigger_valid: true, oracle_passed: !bugObserved, observed, console_errors: consoleErrors }
    fs.writeFileSync("/results/observation.json", JSON.stringify(record, null, 2))
    expect(environmentValid).toBe(true)
    expect(bugObserved).toBe(process.env.REPRO_VARIANT === "buggy")
})
