import { test, expect } from "@playwright/test"
import fs from "node:fs"

test("layoutAnchor keeps the anchored child centered during layout animation", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text())
    })
    await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" })
    await expect(page.locator("#oracle-ready")).toBeAttached()
    await expect(page.locator("#parent")).toBeVisible()
    const initial = await page.locator("#parent").boundingBox()
    const environmentValid = Boolean(initial && initial.width >= 100 && initial.height >= 100)
    await page.locator("#parent").click()
    const timeline = await page.evaluate(async () => {
        const parent = document.querySelector("#parent") as HTMLElement
        const anchored = document.querySelector("#child-anchored") as HTMLElement
        const unanchored = document.querySelector("#child-no-anchor") as HTMLElement
        const center = (rect: DOMRect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
        const samples = []
        let sawMotion = false
        let settledFrames = 0
        let previous = null
        for (let frame = 0; frame < 1500; frame++) {
            const parentCenter = center(parent.getBoundingClientRect())
            const anchoredCenter = center(anchored.getBoundingClientRect())
            const unanchoredCenter = center(unanchored.getBoundingClientRect())
            const activeAnimations = document.getAnimations({ subtree: true }).filter(animation => animation.playState === "running" || animation.playState === "pending")
            const sample = { frame, time: performance.now(), parentCenter, anchoredCenter, unanchoredCenter, anchoredError: distance(parentCenter, anchoredCenter), unanchoredError: distance(parentCenter, unanchoredCenter), activeAnimationCount: activeAnimations.length }
            samples.push(sample)
            const geometryChanged = previous && (Math.abs(sample.parentCenter.x - previous.parentCenter.x) > 0.05 || Math.abs(sample.parentCenter.y - previous.parentCenter.y) > 0.05 || Math.abs(sample.anchoredCenter.x - previous.anchoredCenter.x) > 0.05 || Math.abs(sample.anchoredCenter.y - previous.anchoredCenter.y) > 0.05)
            if (sample.activeAnimationCount > 0 || geometryChanged) {
                sawMotion = true
                settledFrames = 0
            } else if (sawMotion) {
                settledFrames += 1
            }
            previous = sample
            if (sawMotion && settledFrames >= 8) break
            await new Promise(resolve => requestAnimationFrame(resolve))
        }
        return { samples, sawAnimation: sawMotion, settled: sawMotion && settledFrames >= 8 }
    })
    const valid = timeline.samples.filter(sample => Number.isFinite(sample.anchoredError))
    const peak = valid.reduce((best, sample) => sample.anchoredError > best.anchoredError ? sample : best, valid[0])
    const observed = { frames_sampled: timeline.samples.length, saw_animation: timeline.sawAnimation, animation_settled: timeline.settled, maxAnchoredError: peak?.anchoredError ?? null, peakSample: peak ?? null, finalSample: valid.at(-1) ?? null, frame_timeline: timeline.samples }
    const triggerValid = valid.length >= 2 && timeline.sawAnimation
    const bugObserved = triggerValid && observed.maxAnchoredError > 15
    const record = { schema_version: "1.0", instance_id: "motiondivision__motion-3028", mode: process.env.REPRO_VARIANT ?? "unknown", environment_valid: environmentValid, trigger_valid: triggerValid, oracle_passed: !bugObserved, observed, console_errors: consoleErrors }
    fs.writeFileSync("/results/observation.json", JSON.stringify(record, null, 2))
    expect(environmentValid).toBe(true)
    expect(triggerValid).toBe(true)
    expect(bugObserved).toBe(process.env.REPRO_VARIANT === "buggy")
})
