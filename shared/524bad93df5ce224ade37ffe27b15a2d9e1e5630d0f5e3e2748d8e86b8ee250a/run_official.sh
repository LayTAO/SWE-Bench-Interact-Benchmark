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
bash -lc 'node .yarn/releases/yarn-4.10.3.cjs workspace typescript-config-carbon build && node .yarn/releases/yarn-4.10.3.cjs workspaces foreach --recursive --topological --from @carbon/web-components run build && cd packages/web-components && node ../../.yarn/releases/yarn-4.10.3.cjs web-test-runner src/components/menu-button/__tests__/menu-button-test.js src/components/menu/__tests__/menu-item-test.js src/components/menu/__tests__/menu-test.js --config .interactrepair-wtr.config.mjs --coverage=false --concurrency=1' >"$OUTPUT_DIR/official.log" 2>&1
status=$?
set -e
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
