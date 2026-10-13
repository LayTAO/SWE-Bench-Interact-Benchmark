import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  outputDir: process.env.RESULTS_DIR ? `${process.env.RESULTS_DIR}/test-output` : 'test-output',
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    launchOptions: process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : undefined,
    viewport: { width: 960, height: 600 },
    video: 'on',
    trace: 'on',
  },
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0',
    port: 4173,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
