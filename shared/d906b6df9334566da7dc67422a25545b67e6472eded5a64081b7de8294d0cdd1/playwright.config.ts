import {defineConfig} from 'playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {timeout: 10_000},
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    headless: true,
    launchOptions: process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : undefined,
    viewport: {width: 1280, height: 720},
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  webServer: {
    command: 'cd /workspace/repo && node /subject/node_modules/parcel/lib/bin.js .ir-m-008-repro/index.html --config .ir-m-008-repro/.parcelrc --host 127.0.0.1 --port 5173 --no-cache',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
