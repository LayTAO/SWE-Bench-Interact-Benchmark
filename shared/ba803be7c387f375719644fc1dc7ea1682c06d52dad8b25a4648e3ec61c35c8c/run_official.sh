#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
cp /tests/verifier/interactrepair-wtr.config.mjs "$SUBJECT_DIR/packages/web-components/.interactrepair-wtr.config.mjs"
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
set +e
bash -lc 'node .yarn/releases/yarn-4.10.3.cjs workspace typescript-config-carbon build && node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons build && if [[ -d packages/icon-helpers ]]; then node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icon-helpers build; fi && node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons-react build && node .yarn/releases/yarn-4.10.3.cjs workspaces foreach --recursive --topological --from @carbon/react --exclude @carbon/react run build && node .yarn/releases/yarn-4.10.3.cjs test packages/react/src/components/Dropdown/__tests__/Dropdown-test.js --runInBand --json --outputFile=/logs/verifier/official.raw.json'
status=$?
set -e
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
