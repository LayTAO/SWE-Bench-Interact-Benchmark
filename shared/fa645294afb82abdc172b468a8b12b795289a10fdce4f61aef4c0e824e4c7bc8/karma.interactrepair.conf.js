const tags = process.env && process.env['NG_TEST_TAGS'];
const processENV = require('process');
processENV.env.CHROME_BIN = process.env.CHROME_BIN;

module.exports = function (config) {
  config.set({
    basePath: process.env.SUBJECT_DIR,
    frameworks: ['jasmine', '@angular-devkit/build-angular', 'viewport'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-spec-reporter'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-junit-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-viewport')
    ],
    client: {
      jasmine: { random: false },
      clearContext: true,
      ...(tags && { args: [tags] })
    },
    coverageReporter: {
      subdir: '.',
      dir: '/results/coverage-report',
      reporters: [{ type: 'text-summary' }]
    },
    reporters: ['progress', 'kjhtml', 'spec', 'junit'],
    junitReporter: { outputDir: '/results/junit' },
    specReporter: {
      maxLogLines: 5,
      suppressErrorSummary: true,
      suppressFailed: false,
      suppressPassed: false,
      suppressSkipped: true,
      showSpecTiming: false
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--disable-gpu', '--no-sandbox']
      }
    },
    singleRun: true,
    browserDisconnectTimeout: 600000,
    browserNoActivityTimeout: 60000
  });
};
