// Bazel's JUnit XML has one wrapper testcase. WTR/Jasmine's session tree is
// the source of the actual browser assertion names and outcomes.
import fs from 'node:fs';
import path from 'node:path';

function collect(suite, ancestors, assertions) {
  if (!suite || typeof suite !== 'object') return;
  const names = suite.name ? [...ancestors, suite.name] : ancestors;
  for (const test of suite.tests ?? []) {
    assertions.push({
      fullName: [...names, test.name].filter(Boolean).join(' ').trim(),
      status: test.skipped ? 'pending' : test.passed === true ? 'passed' : 'failed',
      failureMessages: test.error
        ? [test.error.stack ?? test.error.message ?? String(test.error)] : [],
    });
  }
  for (const child of suite.suites ?? []) collect(child, names, assertions);
}

export const interactAssertionReporter = {
  onTestRunFinished({sessions}) {
    const directory = process.env.TEST_UNDECLARED_OUTPUTS_DIR;
    const output = process.env.INTERACT_RAW_RESULT;
    const nonce = process.env.INTERACT_REPORT_NONCE;
    if (!output || !path.isAbsolute(output) || !nonce) {
      throw new Error('Verifier assertion output/nonce is missing');
    }
    const testResults = [];
    for (const session of sessions ?? []) {
      const assertionResults = [];
      collect(session.testResults, [], assertionResults);
      testResults.push({
        testFile: session.testFile,
        assertionResults,
        sessionErrors: (session.errors ?? []).map(error =>
          error.stack ?? error.message ?? String(error)),
      });
    }
    const payload = `${JSON.stringify({
      assertionSource: 'wtr-onTestRunFinished', runNonce: nonce,
      numTotalTests: testResults.reduce((n, result) => n + result.assertionResults.length, 0),
      testResults,
    }, null, 2)}\n`;
    fs.writeFileSync(output, payload);
    if (directory) {
      fs.mkdirSync(directory, {recursive: true});
      fs.writeFileSync(path.join(directory, 'official.assertions.json'), payload);
    }
  },
};
