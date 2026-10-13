#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
if git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch; then
  git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
elif git -C "$SUBJECT_DIR" apply --reverse --check /tests/verifier/official_test.patch; then
  :
else
  echo "official test patch is neither applicable nor already applied" >&2
  exit 1
fi
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
status=1
for attempt in 1 2 3 4; do
  attempt_output="$OUTPUT_DIR/official.attempt-${attempt}.raw.json"
  rm -f "$attempt_output"
  set +e
  VITEST_ENV=chromium PLAYWRIGHT_BROWSERS_PATH=/ms-playwright pnpm exec vitest run --config packages/react/vitest.config.mts packages/react/src/select/item/SelectItem.test.tsx --reporter=json --outputFile="$attempt_output" --browser chromium --no-file-parallelism
  status=$?
  set -e
  if [[ -s "$attempt_output" ]]; then cp "$attempt_output" "$OUTPUT_DIR/official.raw.json"; fi
done
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
