import {defineConfig} from '/tooling/node_modules/@playwright/test/index.js'

export default defineConfig({
  testDir: '/oracle/playwright',
  timeout: 45_000,
  expect: {timeout: 10_000},
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['json', {outputFile: '/results/playwright-report.json'}]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    viewport: {width: 960, height: 600},
    launchOptions: {
      executablePath: process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
})
