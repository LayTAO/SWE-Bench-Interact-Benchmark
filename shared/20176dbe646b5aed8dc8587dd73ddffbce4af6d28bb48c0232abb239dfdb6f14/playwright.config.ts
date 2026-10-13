import {defineConfig, devices} from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {timeout: 10_000},
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5173',
    headless: process.env.HEADLESS !== '0',
    launchOptions: process.env.CHROMIUM_EXECUTABLE
      ? {executablePath: process.env.CHROMIUM_EXECUTABLE}
      : undefined,
    viewport: {width: 800, height: 600},
    trace: 'on',
    // The verifier image provides Chromium 1.58.x, while this historical
    // reproduction pins Playwright 1.49.1 whose bundled ffmpeg is absent.
    // Keep trace and screenshots, which are sufficient for the predicate.
    video: 'off',
    screenshot: 'on',
  },
  webServer: process.env.STATIC_REPRO === '1'
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: false,
        timeout: 120_000,
      },
})
