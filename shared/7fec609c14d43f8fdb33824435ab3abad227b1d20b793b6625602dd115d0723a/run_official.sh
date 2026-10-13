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
# The repository build emits the deprecated entry points under dist/esm, while
# this historical demo imports the package subpaths directly.  Expose those
# already-built entry points without changing the subject source or evaluator.
for package in react-core react-table; do
  if [[ -d "packages/$package/dist/esm/deprecated" ]]; then
    ln -sfn dist/esm/deprecated "packages/$package/deprecated"
  fi
done
mkdir -p "$OUTPUT_DIR/junit"
build_status=0
# The gold patch changes react-core source, while the demo imports the package
# entry point from dist/esm. Rebuild the package outputs after applying both
# patches so the official browser test exercises the patched source.
yarn build:esm >"$OUTPUT_DIR/react-build.log" 2>&1
build_status=$?
if [[ "$build_status" -eq 0 ]]; then
  yarn workspace demo-app-ts dev --host 0.0.0.0 --port 3000 >"$OUTPUT_DIR/demo-server.log" 2>&1 &
  server_pid=$!
  trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
  for attempt in $(seq 1 180); do
    if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then break; fi
    sleep 1
  done
  curl -fsS http://127.0.0.1:3000 >/dev/null
  (cd packages/react-integration && yarn cypress run --spec cypress/integration/truncate.spec.ts --config baseUrl=http://127.0.0.1:3000 --reporter junit --reporter-options "mochaFile=$OUTPUT_DIR/junit/truncate-[hash].xml,toConsole=true")
  status=$?
else
  status=$build_status
fi
set -e

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

if [[ "$has_assertions" != 1 ]]; then
  node - /tests/verifier/evaluator.json "$status" "$OUTPUT_DIR/official.raw.json" <<'NODE'
const fs = require("fs");
const [evaluatorPath, statusText, output] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
const passed = Number(statusText) === 0;
const make = names => (names || []).map(fullName => ({fullName, status: passed ? "passed" : "failed"}));
const assertionResults = make(evaluator.FAIL_TO_PASS).concat(make(evaluator.PASS_TO_PASS));
fs.writeFileSync(output, JSON.stringify({
  assertionSource: "accepted-exit-code-normalized",
  testResults: [{testFile: "accepted-runner", assertionResults}],
  allTestsPassed: passed,
}, null, 2) + "\n");
NODE
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
