import fs from 'node:fs';

function collectSuite(suite, tests) {
  if (!suite || typeof suite !== 'object') return;

  for (const test of suite.tests || []) {
    if (!test || typeof test.name !== 'string') continue;
    tests.push({
      name: test.name,
      status: test.skipped ? 'skipped' : test.passed ? 'passed' : 'failed',
    });
  }

  for (const child of suite.suites || []) collectSuite(child, tests);
}

export function interactRepairReporter() {
  return {
    onTestRunFinished({sessions}) {
      const sessionList = Array.from(sessions || []);
      const testResults = [];
      const testFiles = [];
      for (const session of sessionList) {
        if (typeof session.testFile === 'string') testFiles.push(session.testFile);
        collectSuite(session.testResults, testResults);
      }

      const output = process.env.INTERACT_RAW_RESULT;
      if (!output) throw new Error('INTERACT_RAW_RESULT is not configured');
      fs.writeFileSync(
        output,
        JSON.stringify(
          {
            testResults,
            testFiles: [...new Set(testFiles)],
            allTestsPassed:
              testResults.length > 0 &&
              testResults.every(test => test.status === 'passed'),
          },
          null,
          2
        ) + '\n'
      );
    },
  };
}
