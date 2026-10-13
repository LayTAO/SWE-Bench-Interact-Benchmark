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
if [[ -L /results || ! -e /results ]]; then
  ln -sfn "$OUTPUT_DIR" /results
elif [[ ! -d /results ]]; then
  echo '/results is not a symlink; refusing to overwrite it' >&2
  exit 2
fi
CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f \( -path '*/chrome-linux64/chrome' -o -path '*/chrome-linux/chrome' -o -path '*/chrome-headless-shell-linux64/chrome-headless-shell' \) -print -quit 2>/dev/null || true)"
if [[ -z "$CHROMIUM_EXECUTABLE" ]]; then
  CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -name chrome -path '*/chromium-*/*' -print -quit 2>/dev/null || true)"
fi
[[ -n "$CHROMIUM_EXECUTABLE" ]] || { echo 'Chromium executable was not found under /ms-playwright' >&2; exit 125; }
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  CHROMIUM_EXECUTABLE CHROME_BIN="$CHROMIUM_EXECUTABLE" \
  SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_FILE="$OUTPUT_DIR/official.raw.json" \
  RESULTS_DIR="$OUTPUT_DIR" MODE=official \
  INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
set +e
bash -lc 'pnpm exec vitest run --config vitest.config.mts packages/components/date-picker-panel/__tests__/date-picker-panel.test.tsx --reporter=json --outputFile=/logs/verifier/official.raw.json'
status=$?
set -e

has_assertions=0
if [[ -s "$OUTPUT_DIR/official.raw.json" ]]; then
  node - "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
const raw = JSON.parse(fs.readFileSync(file, "utf8"));
// Karma's Accepted reporter emits real assertions at the document root.
// Normalize only their container, retaining the original report and statuses.
if (Array.isArray(raw.assertionResults) && raw.assertionResults.length && !raw.testResults) {
  fs.copyFileSync(file, file + ".original");
  raw.testResults = [{assertionResults: raw.assertionResults}];
  delete raw.assertionResults;
  raw.assertionSource = "karma-structured-test-output";
  fs.writeFileSync(file, JSON.stringify(raw, null, 2) + "\n");
}
NODE
fi
if [[ -s "$OUTPUT_DIR/official.raw.json" ]]; then
  if node - "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require("fs");
try {
  const data = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const count = (data.testResults || []).reduce((total, suite) => total + (suite.assertionResults || []).length, 0);
  process.exit(count > 0 ? 0 : 1);
} catch (_) {
  process.exit(1);
}
NODE
  then
    has_assertions=1
  fi
fi

if [[ "$has_assertions" != 1 && -d "$OUTPUT_DIR/junit" ]]; then
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
const assertionResults = [];
for (const file of files) {
  const xml = fs.readFileSync(file, "utf8");
  for (const match of xml.matchAll(/<testcase\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/testcase\s*>)/g)) {
    const value = attrs(match[1]);
    const body = match[2] || "";
    const status = /<(?:failure|error)\b/.test(body) ? "failed" : /<skipped\b/.test(body) ? "pending" : "passed";
    const fullName = [value.classname, value.name].filter(Boolean).join(" ");
    if (fullName) assertionResults.push({fullName, status});
  }
}
if (assertionResults.length > 0) {
  fs.writeFileSync(output, JSON.stringify({
    assertionSource: "junit",
    testResults: [{testFile: "junit", assertionResults}],
    allTestsPassed: assertionResults.every(item => item.status === "passed"),
  }, null, 2) + "\n");
}
NODE
  if [[ -s "$OUTPUT_DIR/official.raw.json" ]]; then
    has_assertions=1
  fi
fi

if [[ "$has_assertions" != 1 && -s "$OUTPUT_DIR/official.raw.json" ]]; then
  if node - "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json <<'NODE'
const fs = require("fs");
const [rawPath, evaluatorPath] = process.argv.slice(2);
const text = fs.readFileSync(rawPath, "utf8");
const summaries = [...text.matchAll(/(?:Chromium|Firefox|WebKit):[^\n]*?(\d+) passed, (\d+) failed/g)]
  .map(match => ({passed: Number(match[1]), failed: Number(match[2])}));
if (!/all tests passed/i.test(text) || summaries.length === 0 || summaries.some(item => item.failed !== 0)) {
  process.exit(1);
}
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
const names = [...(evaluator.FAIL_TO_PASS || []), ...(evaluator.PASS_TO_PASS || [])];
if (names.length === 0) process.exit(1);
const assertionResults = names.map(fullName => ({fullName, status: "passed"}));
fs.writeFileSync(rawPath, JSON.stringify({
  assertionSource: "web-test-runner-text-summary",
  allTestsPassed: true,
  browserSummaries: summaries,
  testResults: [{testFile: "web-test-runner", assertionResults}],
}, null, 2) + "\n");
NODE
  then
    has_assertions=1
  fi
fi

if [[ "$has_assertions" != 1 ]]; then
  echo 'Official runner produced no real assertions; preserving raw evidence and refusing exit-code-only acceptance.' >&2
  exit 3
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
