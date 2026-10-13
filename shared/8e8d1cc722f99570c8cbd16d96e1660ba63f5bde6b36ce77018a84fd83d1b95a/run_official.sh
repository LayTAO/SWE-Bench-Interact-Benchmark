#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
cd "$SUBJECT_DIR"
set +e
react_log="$OUTPUT_DIR/official.react.log"
utils_log="$OUTPUT_DIR/official.utils.log"
# These are two independent selected suites. A failure in the React suite must
# not short-circuit the utility suite or erase its P2P assertion evidence.
bash -lc 'pnpm test-react app/src/sandbox/popover-6310/test.ts --run --reporter=json' >"$react_log" 2>&1
react_status=$?
bash -lc 'pnpm test packages/ariakit-utils/src/focus.test.ts --run --reporter=json' >"$utils_log" 2>&1
utils_status=$?
set -e
status=0
if (( react_status != 0 || utils_status != 0 )); then status=1; fi
node - "$react_log" "$utils_log" "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require('fs');
const [reactLog, utilsLog, rawPath] = process.argv.slice(2);
const results = [];
for (const logPath of [reactLog, utilsLog]) {
  let found = false;
  for (const line of fs.readFileSync(logPath, 'utf8').split(/\r?\n/)) {
    try {
      const value = JSON.parse(line);
      if (value && Array.isArray(value.testResults) && value.testResults.length > 0) {
        results.push(...value.testResults);
        found = true;
      }
    } catch (_) {}
  }
  if (!found) {
    console.error(`Selected suite produced no structured assertions: ${logPath}`);
    process.exit(3);
  }
}
fs.writeFileSync(rawPath, JSON.stringify({ testResults: results }) + '\n');
NODE
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
