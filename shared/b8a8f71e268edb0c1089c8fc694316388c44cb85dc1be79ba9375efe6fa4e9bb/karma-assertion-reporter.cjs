// Runs inside Bazel's Karma test action. This records Jasmine's real per-spec
// callbacks, rather than inferring them from Bazel's one-case wrapper XML.
const fs = require('fs');
const path = require('path');

function InteractAssertionReporter(baseReporterDecorator) {
  baseReporterDecorator(this);
  const assertions = [];
  this.onSpecComplete = (browser, result) => {
    const suites = Array.isArray(result.suite) ? result.suite : [];
    const name = [...suites, result.description].filter(Boolean).join(' ').trim();
    assertions.push({
      fullName: name,
      status: result.skipped ? 'pending' : result.success === true ? 'passed' : 'failed',
      browser: browser && browser.name || null,
      failureMessages: Array.isArray(result.log) ? result.log : [],
    });
  };
  this.onRunComplete = () => {
    const directory = process.env.TEST_UNDECLARED_OUTPUTS_DIR;
    const output = process.env.INTERACT_RAW_RESULT;
    const nonce = process.env.INTERACT_REPORT_NONCE;
    if (!output || !path.isAbsolute(output) || !nonce) {
      throw new Error('Verifier assertion output/nonce is missing');
    }
    const payload = `${JSON.stringify({
      assertionSource: 'karma-onSpecComplete',
      runNonce: nonce,
      numTotalTests: assertions.length,
      testResults: [{testFile: 'src/cdk/scrolling:unit_tests_chromium', assertionResults: assertions}],
    }, null, 2)}\n`;
    fs.writeFileSync(output, payload);
    if (directory) {
      fs.mkdirSync(directory, {recursive: true});
      fs.writeFileSync(path.join(directory, 'official.assertions.json'), payload);
    }
  };
}
InteractAssertionReporter.$inject = ['baseReporterDecorator'];
module.exports = {'reporter:interact_assertions': ['type', InteractAssertionReporter]};
