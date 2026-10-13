#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${INTERACT_SUBJECT_DIR:-/workspace/repo}"
export ARIAKIT_TEST_LOADER=react

work=/tmp/interact-official
mkdir -p "$work"
status=0
node node_modules/vitest/vitest.mjs \
  app/src/examples/combobox-group/test.ts \
  --run --reporter=json --outputFile="$work/examples.json" || status=$?
node node_modules/vitest/vitest.mjs \
  app/src/sandbox/combobox-ime-6663/test.ts \
  --run --reporter=json --outputFile="$work/sandbox.json" || status=$?

node - "$work/examples.json" "$work/sandbox.json" "$RAW" <<'NODE'
const fs = require("fs");
const [examplesPath, sandboxPath, outputPath] = process.argv.slice(2);
const reports = [examplesPath, sandboxPath].map((path) => {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (_) {
    return { testResults: [], success: false };
  }
});
const testResults = reports.flatMap((report) => report.testResults || []);
const sum = (key) => reports.reduce((total, report) => total + Number(report[key] || 0), 0);
const merged = {
  ...reports[0],
  numTotalTestSuites: sum("numTotalTestSuites"),
  numPassedTestSuites: sum("numPassedTestSuites"),
  numFailedTestSuites: sum("numFailedTestSuites"),
  numPendingTestSuites: sum("numPendingTestSuites"),
  numTotalTests: sum("numTotalTests"),
  numPassedTests: sum("numPassedTests"),
  numFailedTests: sum("numFailedTests"),
  numPendingTests: sum("numPendingTests"),
  numTodoTests: sum("numTodoTests"),
  success: reports.every((report) => report.success === true),
  testResults,
};
fs.writeFileSync(outputPath, JSON.stringify(merged) + "\n");
NODE
exit "$status"
