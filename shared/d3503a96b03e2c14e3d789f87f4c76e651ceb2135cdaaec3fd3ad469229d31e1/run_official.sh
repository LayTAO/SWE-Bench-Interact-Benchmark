#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
export RESULTS_DIR="$OUTPUT_DIR" MODE=official
cd "$SUBJECT_DIR"
set +e
bash -lc 'corepack yarn workspace typescript-config-carbon build && corepack yarn workspace @carbon/icons build && if [[ -d packages/icon-helpers ]]; then corepack yarn workspace @carbon/icon-helpers build; fi && corepack yarn workspace @carbon/icons-react build && corepack yarn workspaces foreach --recursive --topological --from @carbon/react --exclude @carbon/react run build && corepack yarn test packages/react/src/components/ComposedModal/ComposedModal-test.js packages/react/src/components/Modal/Modal-test.js --runInBand --json --outputFile="$RESULTS_DIR/$MODE.raw.json"'
status=$?
set -e
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
