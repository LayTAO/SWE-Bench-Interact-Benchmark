const fs = require('fs');

function HarborAssertionReporter() {
  const assertions = [];
  const browsers = new Set();
  this.onSpecComplete = (browser, result) => {
    const suite = Array.isArray(result.suite) ? result.suite : [];
    const description = typeof result.description === 'string' ? result.description : '';
    if (browser && typeof browser.name === 'string') browsers.add(browser.name);
    assertions.push({
      fullName: [...suite, description].filter(Boolean).join(' '),
      suite,
      description,
      status: result.skipped ? 'skipped' : result.success ? 'passed' : 'failed',
      browser: browser?.name || null,
      id: result.id || null,
    });
  };
  this.onRunComplete = (_browsers, results) => {
    if (!assertions.length || !process.env.INTERACT_RAW_RESULT) return;
    const passed = assertions.filter(item => item.status === 'passed').length;
    const failed = assertions.filter(item => item.status === 'failed').length;
    const skipped = assertions.filter(item => item.status === 'skipped').length;
    const complete = passed === results.success && failed === results.failed &&
      skipped === results.skipped && !results.disconnected && !results.error;
    fs.writeFileSync(process.env.INTERACT_RAW_RESULT, `${JSON.stringify({
      assertionSource: 'karma-reporter-events',
      selected_assertion_inference: false,
      run_complete: complete,
      runNonce: process.env.INTERACT_RAW_NONCE || null,
      browsers: [...browsers],
      event_count: assertions.length,
      numTotalTests: assertions.length,
      numPassedTests: passed,
      numFailedTests: failed,
      numPendingTests: skipped,
      testResults: [{testFile: 'karma-events', assertionResults: assertions}],
    }, null, 2)}\n`);
  };
}

module.exports = {
  'reporter:harbor-json': ['type', HarborAssertionReporter],
};
