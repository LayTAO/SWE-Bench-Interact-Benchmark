#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
if ! git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch >"$OUTPUT_DIR/official-apply.log" 2>&1; then
  exit 2
fi
if ! git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch >>"$OUTPUT_DIR/official-apply.log" 2>&1; then
  exit 2
fi
touch "$OUTPUT_DIR/official-apply.ok"
if [[ ! -e /results || ! -L /results ]]; then
  rm -rf /results
  ln -s "$OUTPUT_DIR" /results
fi
CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -path '*/chrome-linux64/chrome' -print -quit 2>/dev/null || true)"
if [[ -z "$CHROMIUM_EXECUTABLE" ]]; then
  CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
fi
CHROME_BIN_PATH=/usr/local/bin/harbor-chrome
[[ -x "$CHROME_BIN_PATH" ]] || CHROME_BIN_PATH="$CHROMIUM_EXECUTABLE"
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  CHROMIUM_EXECUTABLE CHROME_BIN="$CHROME_BIN_PATH" \
  SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_FILE="$OUTPUT_DIR/official.raw.json" \
  RESULTS_DIR="$OUTPUT_DIR" MODE=official \
  INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
set +e
bash -lc 'BROWSER=ChromeHeadless CONTINUOUS_INTEGRATION=true yarn test-browser --single-run' \
  2>&1 | tee "$OUTPUT_DIR/official-command.log"
status=${PIPESTATUS[0]}
set -e

if ! node /tests/verifier/parse_karma_mocha.cjs \
  "$OUTPUT_DIR/official-command.log" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.raw.json" "$status"; then
  echo 'Selected Modal assertions lack unique Karma-Mocha line evidence' >&2
fi

node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
