#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
export OUTPUT_DIR
cd "$SUBJECT_DIR"
export INTERACT_SUBJECT_DIR="$SUBJECT_DIR"
set +e
bash -lc '
  react_status=0
  pnpm test-react app/src/sandbox/dialog-6344/test.ts --run --reporter=json \
    --outputFile="$OUTPUT_DIR/official.react.json" || react_status=$?
  unit_status=0
  ARIAKIT_TEST_LOADER=react pnpm test-react \
    packages/ariakit-react-components/src/dialog/utils/orchestrate.test.ts \
    --run --reporter=json --outputFile="$OUTPUT_DIR/official.unit.json" || unit_status=$?
  if [[ "$react_status" -ne 0 || "$unit_status" -ne 0 ]]; then
    exit 1
  fi
'
status=$?
set -e
node - "$OUTPUT_DIR/official.react.json" "$OUTPUT_DIR/official.unit.json" \
  "$OUTPUT_DIR/official.raw.json" "$status" <<'NODE'
const fs = require("fs");
const [reactPath, unitPath, outputPath, status] = process.argv.slice(2);
const reports = [reactPath, unitPath].map((path) => {
  try { return JSON.parse(fs.readFileSync(path, "utf8")); }
  catch (_) { return { testResults: [] }; }
});
const testResults = reports.flatMap((report) => report.testResults || []);
const merged = {
  numTotalTestSuites: reports.reduce((n, report) => n + Number(report.numTotalTestSuites || 0), 0),
  numPassedTestSuites: reports.reduce((n, report) => n + Number(report.numPassedTestSuites || 0), 0),
  numFailedTestSuites: reports.reduce((n, report) => n + Number(report.numFailedTestSuites || 0), 0),
  numTotalTests: reports.reduce((n, report) => n + Number(report.numTotalTests || 0), 0),
  numPassedTests: reports.reduce((n, report) => n + Number(report.numPassedTests || 0), 0),
  numFailedTests: reports.reduce((n, report) => n + Number(report.numFailedTests || 0), 0),
  success: Number(status) === 0 && reports.every((report) => report.success !== false),
  testResults,
};
fs.writeFileSync(outputPath, JSON.stringify(merged) + "\n");
NODE
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
