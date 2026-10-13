const fs = require('fs');
const baseFactory = require('./karma.conf');
function Reporter(baseReporterDecorator) {
  baseReporterDecorator(this);
  const assertionResults = [];
  this.onSpecComplete = (_browser, result) => assertionResults.push({
    fullName: [...result.suite, result.description].join(' '),
    status: result.skipped ? 'pending' : result.success ? 'passed' : 'failed',
    failureMessages: result.log || [],
  });
  this.onRunComplete = (_browsers, result) => fs.writeFileSync(process.env.RESULTS_JSON, JSON.stringify({
    numPassedTests: result.success,
    numFailedTests: result.failed,
    numPendingTests: result.skipped,
    assertionResults,
  }, null, 2));
}
Reporter.$inject = ['baseReporterDecorator'];
module.exports = function config(config) {
  baseFactory(config);
  process.env.CHROME_BIN = process.env.INTERACTREPAIR_CHROME_BIN;
  config.set({
    browsers: ['chromeHeadless'], singleRun: true, reporters: ['interactrepair'],
    files: [{ pattern: 'test/interactrepair.karma.tests.js', watched: false }],
    preprocessors: { 'test/interactrepair.karma.tests.js': ['webpack', 'sourcemap'] },
    plugins: ['karma-mocha', 'karma-chrome-launcher', 'karma-coverage-istanbul-reporter',
      'karma-sourcemap-loader', 'karma-webpack', {'reporter:interactrepair': ['type', Reporter]}],
  });
};
