#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
if (cd site && pnpm --filter site build-min) >"$OUTPUT_DIR/official-build.log" 2>&1; then
  set +e
  (
    cd site
    PLAYWRIGHT_JSON_OUTPUT_NAME="$OUTPUT_DIR/official-4825.playwright.json" \
      pnpm test-chrome src/sandbox/4825-dialog-combobox/test-browser.ts \
        --workers=1 --retries=0 --reporter=json
  )
  first_status=$?
  (
    cd site
    PLAYWRIGHT_JSON_OUTPUT_NAME="$OUTPUT_DIR/official-regression.playwright.json" \
      pnpm test-chrome src/sandbox/5047-select-combobox/test-browser.ts \
        src/sandbox/5518-combobox/test-browser.ts \
        --workers=1 --retries=0 --reporter=json
  )
  second_status=$?
  set -e
  status=0
  [[ "$first_status" == 0 && "$second_status" == 0 ]] || status=1
else
  status=1
fi
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]] || ! node - "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
try {
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  const hasStatus = (node) => {
    if (!node || typeof node !== "object") return false;
    if (typeof node.status === "string" && (node.fullName || node.title || node.name)) return true;
    return Object.values(node).some(hasStatus);
  };
  process.exit(hasStatus(value) ? 0 : 1);
} catch (_) {
  process.exit(1);
}
NODE
then
  if [[ -s "$OUTPUT_DIR/official-4825.playwright.json" || -s "$OUTPUT_DIR/official-regression.playwright.json" ]]; then
    node - \
      "$OUTPUT_DIR/official-4825.playwright.json" \
      "$OUTPUT_DIR/official-regression.playwright.json" \
      "$OUTPUT_DIR/official.raw.json" "$status" <<'NODE'
const fs = require("fs");
const [firstPath, secondPath, outputPath, statusText] = process.argv.slice(2);
const testResults = [];
function collectSuite(suite, parentFile = "") {
  if (!suite || typeof suite !== "object") return;
  const file = suite.file || parentFile;
  for (const spec of suite.specs || []) {
    const title = spec.title;
    for (const test of spec.tests || []) {
      const status = test.status || test.results?.at(-1)?.status;
      if (title && status) testResults.push({name: `${file}::${title}`, status});
    }
  }
  for (const child of suite.suites || []) collectSuite(child, file);
}
for (const inputPath of [firstPath, secondPath]) {
  if (!fs.existsSync(inputPath)) continue;
  try {
    const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    for (const suite of report.suites || []) collectSuite(suite);
  } catch (_) {
    // The command status remains authoritative when a reporter file is invalid.
  }
}
fs.writeFileSync(outputPath, JSON.stringify({exit_code: Number(statusText), testResults}) + "\n");
NODE
  else
    printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
  fi
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
