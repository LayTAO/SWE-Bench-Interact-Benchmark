module.exports = {
  testDir: '.', testMatch: 'scenario.spec.cjs', workers: 1, retries: 0,
  timeout: 30000,
  outputDir: process.env.OUTPUT_DIR + '/artifacts',
  reporter: [['json', { outputFile: process.env.OUTPUT_DIR + '/playwright.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 1000, height: 760 },
    trace: 'on', screenshot: 'on',
    launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] },
  },
};
