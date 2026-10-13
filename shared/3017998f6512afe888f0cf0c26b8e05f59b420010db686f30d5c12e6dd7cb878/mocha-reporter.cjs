const fs = require('fs');

function fullTitle(test) {
  return typeof test.fullTitle === 'function' ? test.fullTitle() : test.title;
}

module.exports = function InteractMochaReporter(runner) {
  const assertions = [];
  runner.on('pass', test => assertions.push({
    ancestorTitles: [], title: test.title, fullName: fullTitle(test),
    status: 'passed', duration: test.duration ?? null, failureMessages: [],
  }));
  runner.on('fail', (test, error) => {
    if (test && test.type === 'hook') return;
    assertions.push({
      ancestorTitles: [], title: test.title, fullName: fullTitle(test),
      status: 'failed', duration: test.duration ?? null,
      failureMessages: [error && (error.stack || error.message) || String(error)],
    });
  });
  runner.on('pending', test => assertions.push({
    ancestorTitles: [], title: test.title, fullName: fullTitle(test),
    status: 'pending', duration: null, failureMessages: [],
  }));
  runner.once('end', () => {
    const passed = assertions.filter(test => test.status === 'passed').length;
    const failed = assertions.filter(test => test.status === 'failed').length;
    const pending = assertions.filter(test => test.status === 'pending').length;
    fs.writeFileSync(process.env.INTERACT_MOCHA_RESULT, JSON.stringify({
      success: failed === 0,
      numTotalTests: assertions.length,
      numPassedTests: passed,
      numFailedTests: failed,
      numPendingTests: pending,
      testResults: [{
        name: process.cwd(), status: failed ? 'failed' : 'passed',
        assertionResults: assertions,
      }],
    }, null, 2));
  });
};
