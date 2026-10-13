const fs = require('fs');

const [rawPath, evaluatorPath, outputPath] = process.argv.slice(2);
const evaluation = JSON.parse(fs.readFileSync(evaluatorPath, 'utf8'));
const statuses = new Map();
let rawError = null;
try {
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  for (const suite of raw.testResults || []) {
    for (const assertion of suite.assertionResults || []) {
      statuses.set(assertion.fullName, assertion.status);
    }
  }
} catch (error) {
  rawError = String(error && error.message || error);
}

function count(names) {
  let passed = 0;
  for (const name of names) if (statuses.get(name) === 'passed') passed += 1;
  return { passed, failed: names.length - passed, total: names.length };
}

const payload = {
  phase: 'official-tests',
  FAIL_TO_PASS: count(evaluation.FAIL_TO_PASS),
  PASS_TO_PASS: count(evaluation.PASS_TO_PASS),
  raw_result_error: rawError,
};
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n');
if (payload.raw_result_error || payload.FAIL_TO_PASS.failed || payload.PASS_TO_PASS.failed) process.exit(1);
