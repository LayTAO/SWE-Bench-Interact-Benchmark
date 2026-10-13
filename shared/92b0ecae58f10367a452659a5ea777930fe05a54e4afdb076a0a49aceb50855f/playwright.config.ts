import { defineConfig } from '/tooling/node_modules/playwright/test.mjs'

export default defineConfig({
  testDir: '/tests', testMatch: 'scenario.spec.ts', timeout: 60_000, workers: 1, retries: 0,
  reporter: 'line',
  use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4173', viewport: { width: 1024, height: 768 }, headless: true, launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE } },
  outputDir: '/results/test-results',
})
