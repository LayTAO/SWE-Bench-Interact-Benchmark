#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?set SUBJECT_DIR to the exact Buggy or Fixed checkout}"
: "${OUTPUT_FILE:?set OUTPUT_FILE to an isolated JSON result path}"
cd "$SUBJECT_DIR"
status=1
for attempt in 1 2 3 4; do
  attempt_output="${OUTPUT_FILE}.attempt-${attempt}"
  rm -f "$attempt_output"
  set +e
  VITEST_ENV=chromium PLAYWRIGHT_BROWSERS_PATH=/ms-playwright pnpm exec vitest run --config packages/react/vitest.config.mts packages/react/src/dialog/root/DialogRoot.test.tsx --reporter=json --outputFile="$attempt_output" --browser chromium --no-file-parallelism
  status=$?
  set -e
  if [[ -s "$attempt_output" ]]; then cp "$attempt_output" "$OUTPUT_FILE"; fi
done
exit "$status"
