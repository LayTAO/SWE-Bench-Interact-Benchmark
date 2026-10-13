#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
cd "$SUBJECT_DIR"
# Playwright's webServer command invokes the repository-local cross-env binary.
# The globally installed Playwright CLI does not add node_modules/.bin to PATH.
export PATH="$SUBJECT_DIR/node_modules/.bin:$PATH"
set +e
bash -lc 'playwright test e2e/date-picker.e2e.ts --grep '\''normalizes reversed range dates entered via input on blur|should allow selecting dates after typing end date first'\'' --reporter=json' \
  >"$OUTPUT_DIR/official.raw.json" 2>"$OUTPUT_DIR/official.log"
status=$?
set -e
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
