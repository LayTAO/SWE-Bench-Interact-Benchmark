import { defineConfig } from '/tooling/node_modules/playwright/test.mjs'

export default defineConfig({
  testDir: '/tests',
  testMatch: 'scenario.spec.ts',
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 960, height: 600 },
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  outputDir: '/results/test-results',
})
