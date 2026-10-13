const fs = require('fs');
const cypress = require(require.resolve('cypress', { paths: [process.env.SUBJECT_DIR] }));
(async () => {
  const result = await cypress.run({
    project: process.env.SUBJECT_DIR,
    browser: 'electron',
    spec: 'cypress/integration/ContextMenu.spec.ts',
    reporter: 'json',
  });
  if (!Array.isArray(result.runs) || result.runs.length !== 1) throw new Error('Expected exactly one Cypress spec');
  const testResults = result.runs.map(run => ({
    testFile: run.spec.relative,
    assertionResults: run.tests.map(test => ({
      fullName: test.title.join(' '),
      status: test.state,
      attempts: test.attempts,
    })),
  }));
  const raw = { assertionSource: 'cypress-module-api', testResults,
    numTotalTests: result.totalTests, numPassedTests: result.totalPassed,
    numFailedTests: result.totalFailed, numPendingTests: result.totalPending,
    numSkippedTests: result.totalSkipped };
  fs.writeFileSync(process.env.INTERACT_RAW_RESULT, JSON.stringify(raw, null, 2) + '\n');
  process.exit(result.totalFailed === 0 && result.totalTests > 0 ? 0 : 1);
})().catch(error => { console.error(error); process.exit(2); });
