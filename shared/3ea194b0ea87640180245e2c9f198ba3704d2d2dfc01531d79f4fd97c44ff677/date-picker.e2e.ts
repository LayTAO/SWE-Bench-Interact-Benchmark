import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/date-picker/range")
})

test("normalizes reversed range dates entered via input on blur", async ({ page }) => {
  const inputs = page.locator('[data-scope="date-picker"][data-part="input"]')
  const start = inputs.nth(0)
  const end = inputs.nth(1)

  await start.fill("06/20/2024")
  await start.press("Tab")
  await end.fill("06/10/2024")
  await end.press("Tab")

  await expect(start).toHaveValue("06/10/2024")
  await expect(end).toHaveValue("06/20/2024")
})
