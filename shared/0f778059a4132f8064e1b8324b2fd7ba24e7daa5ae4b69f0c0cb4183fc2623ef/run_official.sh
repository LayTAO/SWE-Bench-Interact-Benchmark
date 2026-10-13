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
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  CHROMIUM_EXECUTABLE CHROME_BIN="$CHROMIUM_EXECUTABLE" \
  SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_FILE="$OUTPUT_DIR/official.raw.json" \
  RESULTS_DIR="$OUTPUT_DIR" MODE=official \
  INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
set +e
bash -lc 'cd packages/primevue && pnpm exec vitest run src/multiselect/MultiSelect.spec.js --threads=false --reporter=json --outputFile="$RESULTS_DIR/runner.raw.json"'
status=$?
set -e

# Vitest writes the actual per-test assertion results to runner.raw.json. The
# command exit status alone cannot identify the selected F2P/P2P assertions.
if [[ -s "$OUTPUT_DIR/runner.raw.json" ]]; then
  node - "$OUTPUT_DIR/runner.raw.json" "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require('fs');
const [input, output] = process.argv.slice(2);
try {
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));
  const assertions = (data.testResults || []).flatMap(suite => suite.assertionResults || []);
  if (assertions.length > 0) {
    data.assertionSource = 'vitest-json';
    fs.writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`);
  }
} catch (_) {
  // The summarizer fails closed if Vitest did not produce valid test results.
}
NODE
fi

has_assertions=0
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

node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
