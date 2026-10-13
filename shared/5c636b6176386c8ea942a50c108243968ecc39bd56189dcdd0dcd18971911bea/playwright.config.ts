import {defineConfig} from '/tooling/node_modules/@playwright/test/index.js'

export default defineConfig({
  testDir: '/oracle/playwright',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    viewport: {width: 1280, height: 720},
    trace: 'off',
    video: 'off',
    screenshot: 'off'
  }
})
