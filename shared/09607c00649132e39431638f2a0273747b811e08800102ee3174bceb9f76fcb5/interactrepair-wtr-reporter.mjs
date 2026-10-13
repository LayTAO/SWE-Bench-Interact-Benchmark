import fs from 'node:fs';

function collect(suite, parents, output) {
  if (!suite || typeof suite !== 'object') return;
  const path = suite.name ? [...parents, suite.name] : parents;
  for (const test of suite.tests || []) {
    if (!test || typeof test.name !== 'string') continue;
    output.push({
      fullName: [...path, test.name].join(' > '),
      status: test.skipped ? 'skipped' : test.passed ? 'passed' : 'failed',
    });
  }
  for (const child of suite.suites || []) collect(child, path, output);
}

export function interactRepairReporter() {
  return {
    onTestRunFinished({ sessions }) {
      const testResults = [];
      const files = [];
      for (const session of Array.from(sessions || [])) {
        const assertions = [];
        collect(session.testResults, [], assertions);
        if (typeof session.testFile === 'string') files.push(session.testFile);
        testResults.push({
          testFile: session.testFile ?? null,
          browser: session.browser?.name ?? session.browser?.type ?? null,
          assertionResults: assertions,
        });
      }
      const output = process.env.INTERACT_RAW_RESULT;
      if (!output) throw new Error('INTERACT_RAW_RESULT is not configured');
      fs.writeFileSync(output, JSON.stringify({
        assertionSource: 'web-test-runner-native',
        testFiles: [...new Set(files)],
        testResults,
      }, null, 2) + '\n');
    },
  };
}
