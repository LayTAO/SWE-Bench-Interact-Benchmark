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
    viewport: {width: 960, height: 640},
    trace: 'on',
    video: 'on',
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
