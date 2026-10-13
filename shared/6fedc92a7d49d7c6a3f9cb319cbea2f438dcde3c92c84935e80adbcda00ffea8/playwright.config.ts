import {defineConfig} from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    headless: true,
    launchOptions: process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : undefined,
    viewport: {width: 1280, height: 720},
    trace: 'on',
    // The verifier image supplies Chromium 1.58.x, while this historical
    // reproduction pins Playwright 1.49.1 whose bundled ffmpeg is absent.
    // Keep trace evidence without requiring the older ffmpeg binary.
    video: 'off',
    screenshot: 'off'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})
