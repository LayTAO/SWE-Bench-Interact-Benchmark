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
CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -path '*/chrome-linux*/chrome' -print -quit 2>/dev/null || true)"
if [[ -z "$CHROMIUM_EXECUTABLE" ]]; then
  CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
fi
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  CHROMIUM_EXECUTABLE CHROME_BIN="$CHROMIUM_EXECUTABLE" \
  SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_FILE="$OUTPUT_DIR/official.raw.json" \
  RESULTS_DIR="$OUTPUT_DIR" MODE=official \
  INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
mkdir -p "$OUTPUT_DIR/junit"
set +e
pnpm dev >"$OUTPUT_DIR/storybook.log" 2>&1 &
storybook_pid=$!
storybook_ready=false
for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:9009 >/dev/null 2>&1; then
    storybook_ready=true
    break
  fi
  sleep 1
done
if [[ "$storybook_ready" != true ]]; then
  kill "$storybook_pid" 2>/dev/null || true
  wait "$storybook_pid" 2>/dev/null || true
  status=1
else
  status=0
  # Keep the same four Accepted specs, but label each reporter file with its
  # originating spec. That makes the selected-test mapping unambiguous even
  # where different specs use the same leaf title.
  for spec in ContextMenu DropdownMenu Popover Select; do
    CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
      pnpm exec cypress run --browser "$CHROMIUM_EXECUTABLE" \
        --spec "cypress/e2e/${spec}.cy.ts" \
        --reporter junit \
        --reporter-options "mochaFile=$OUTPUT_DIR/junit/${spec}-[hash].xml,toConsole=true"
    spec_status=$?
    if [[ "$spec_status" -ne 0 ]]; then status=1; fi
  done
  kill "$storybook_pid" 2>/dev/null || true
  wait "$storybook_pid" 2>/dev/null || true
fi
set -e

if [[ -d "$OUTPUT_DIR/junit" ]]; then
  node - "$OUTPUT_DIR/junit" "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require("fs");
const path = require("path");
const [root, output] = process.argv.slice(2);
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) walk(file);
    else if (name.endsWith(".xml")) files.push(file);
  }
}
walk(root);
const attrs = text => {
  const values = {};
  for (const match of text.matchAll(/([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*(["'])(.*?)\2/g)) {
    values[match[1]] = match[3]
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  }
  return values;
};
const testResults = [];
for (const file of files) {
  const spec = path.basename(file).match(/^(ContextMenu|DropdownMenu|Popover|Select)-[^/]+\.xml$/)?.[1];
  if (!spec) continue;
  const xml = fs.readFileSync(file, "utf8");
  const assertionResults = [];
  for (const match of xml.matchAll(/<testcase\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/testcase\s*>)/g)) {
    const value = attrs(match[1]);
    const body = match[2] || "";
    const status = /<(?:failure|error)\b/.test(body) ? "failed" : /<skipped\b/.test(body) ? "pending" : "passed";
    const fullName = [value.classname, value.name].filter(Boolean).join(" ");
    if (fullName) assertionResults.push({fullName, status});
  }
  if (assertionResults.length) testResults.push({testFile: `cypress/e2e/${spec}.cy.ts`, assertionResults});
}
if (testResults.length > 0) {
  fs.writeFileSync(output, JSON.stringify({
    assertionSource: "cypress-junit-per-spec",
    testResults,
    allTestsPassed: testResults.every(suite => suite.assertionResults.every(item => item.status === "passed")),
  }, null, 2) + "\n");
}
NODE
fi

node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
