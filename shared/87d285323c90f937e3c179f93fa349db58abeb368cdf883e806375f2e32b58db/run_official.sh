#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
set +e
command_log="$OUTPUT_DIR/official.command.log"
bash -lc 'pnpm test-react app/src/sandbox/tab-select-6346/test.ts packages/ariakit-components/src/tab/tab-store.test.ts examples/tab/test.ts --run --reporter=json' >"$command_log" 2>&1
status=$?
set -e
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  OFFICIAL_STATUS="$status" node - "$command_log" "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require('fs');
const [logPath, rawPath] = process.argv.slice(2);
const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
for (let index = lines.length - 1; index >= 0; index -= 1) {
  try {
    const value = JSON.parse(lines[index]);
    if (value && Array.isArray(value.testResults)) {
      fs.writeFileSync(rawPath, JSON.stringify(value) + '\n');
      process.exit(0);
    }
  } catch (_) {}
}
fs.writeFileSync(rawPath, JSON.stringify({exit_code: Number(process.env.OFFICIAL_STATUS || 1), testResults: []}) + '\n');
NODE
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
