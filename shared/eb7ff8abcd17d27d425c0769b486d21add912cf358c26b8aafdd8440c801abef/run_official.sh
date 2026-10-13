#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
# The frozen Accepted test patch calls the new four-argument anchor API, but
# the buggy base declares these functions with only three arguments. ts-jest
# otherwise stops before executing any NOP assertions (TS2554). Cast only the
# eight exact anchor call sites in the test source; TypeScript erases casts, so
# the runtime calls, assertions and frozen official patch remain unchanged.
node - "$SUBJECT_DIR/packages/motion-dom/src/projection/geometry/__tests__/delta-calc.test.ts" \
  "$OUTPUT_DIR/official-type-compat.log" <<'NODE'
const fs = require('fs');
const [target, log] = process.argv.slice(2);
let source = fs.readFileSync(target, 'utf8');
const edits = [
  ['calcRelativeBox(\n            target,\n            { x: { min: 0, max: 50 }, y: { min: 0, max: 100 } },',
   ';(calcRelativeBox as (...args: any[]) => void)(\n            target,\n            { x: { min: 0, max: 50 }, y: { min: 0, max: 100 } },'],
  ['calcRelativePosition(\n            target,\n            { x: { min: 200, max: 300 }, y: { min: 150, max: 250 } },',
   ';(calcRelativePosition as (...args: any[]) => void)(\n            target,\n            { x: { min: 200, max: 300 }, y: { min: 150, max: 250 } },'],
  ['calcRelativePosition(relative, child, parent, anchor)',
   ';(calcRelativePosition as (...args: any[]) => void)(relative, child, parent, anchor)'],
  ['calcRelativeBox(reconstructed, relative, parent, anchor)',
   ';(calcRelativeBox as (...args: any[]) => void)(reconstructed, relative, parent, anchor)'],
  ['calcRelativeAxisPosition(target1, layout, parent, 0)',
   ';(calcRelativeAxisPosition as (...args: any[]) => void)(target1, layout, parent, 0)'],
  ['calcRelativeAxisPosition(target, { min: 200, max: 300 }, { min: 100, max: 500 }, 1)',
   ';(calcRelativeAxisPosition as (...args: any[]) => void)(target, { min: 200, max: 300 }, { min: 100, max: 500 }, 1)'],
  ['calcRelativeAxis(target1, relative, parent, 0)',
   ';(calcRelativeAxis as (...args: any[]) => void)(target1, relative, parent, 0)'],
  ['calcRelativeAxis(target, { min: -25, max: 25 }, { min: 500, max: 800 }, 0.5)',
   ';(calcRelativeAxis as (...args: any[]) => void)(target, { min: -25, max: 25 }, { min: 500, max: 800 }, 0.5)'],
];
for (const [before, after] of edits) {
  if (source.split(before).length !== 2 || source.includes(after)) {
    throw new Error(`Frozen test call changed; refusing compatibility edit: ${before}`);
  }
  source = source.replace(before, after);
}
fs.writeFileSync(target, source);
fs.writeFileSync(log, `Applied ${edits.length} exact type-only test-call casts.\n`);
NODE
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
set +e
bash -lc 'yarn jest --config packages/motion-dom/jest.config.json --reporters default --runTestsByPath packages/motion-dom/src/projection/geometry/__tests__/delta-calc.test.ts --runInBand --json --outputFile=/logs/verifier/official.raw.json'
status=$?
set -e
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
