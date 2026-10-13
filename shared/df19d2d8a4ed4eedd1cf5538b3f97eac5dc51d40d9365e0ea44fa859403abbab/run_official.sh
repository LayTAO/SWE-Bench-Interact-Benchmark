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
# Accepted's test helper predates this branch's ListOption type. This exact
# type-only cast makes the frozen test support compile; it does not change the
# emitted JavaScript, selected specs, or the immutable official patch bytes.
node - "$SUBJECT_DIR/packages/nimble-components/src/select/testing/select.pageobject.ts" \
  "$OUTPUT_DIR/official-apply.log" <<'NODE'
const fs = require('fs');
const [target, log] = process.argv.slice(2);
const before = '(o as ListOption).activeOption';
const after = '(o as ListOption & { activeOption?: boolean }).activeOption';
const body = fs.readFileSync(target, 'utf8');
if (body.split(before).length !== 2 || body.includes(after)) {
  throw new Error('Accepted Select helper changed; refusing type-only compatibility edit');
}
fs.writeFileSync(target, body.replace(before, after));
fs.appendFileSync(log, 'Applied exact type-only compatibility cast after frozen official patch.\n');
NODE
touch "$OUTPUT_DIR/official-apply.ok"
if [[ ! -e /results || ! -L /results ]]; then
  rm -rf /results
  ln -s "$OUTPUT_DIR" /results
fi
CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -path '*/chrome-linux64/chrome' -print -quit 2>/dev/null || true)"
if [[ -z "$CHROMIUM_EXECUTABLE" ]]; then
  CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
fi
CHROME_BIN_PATH=/usr/local/bin/harbor-chrome
[[ -x "$CHROME_BIN_PATH" ]] || CHROME_BIN_PATH="$CHROMIUM_EXECUTABLE"
# The historical Karma config derives CHROME_BIN from the repository's old
# Playwright package (chromium-1105).  Bridge that exact path to the browser
# shipped by this verifier image instead of changing the official tests.
PLAYWRIGHT_CHROME_PATH="$(node -e "try { process.stdout.write(require('playwright').chromium.executablePath()) } catch (_) {}" 2>/dev/null || true)"
if [[ -n "$PLAYWRIGHT_CHROME_PATH" ]]; then
  mkdir -p "$(dirname "$PLAYWRIGHT_CHROME_PATH")"
  ln -sfn "$CHROME_BIN_PATH" "$PLAYWRIGHT_CHROME_PATH"
fi
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  CHROMIUM_EXECUTABLE CHROME_BIN="$CHROME_BIN_PATH" \
  SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_FILE="$OUTPUT_DIR/official.raw.json" \
  RESULTS_DIR="$OUTPUT_DIR" MODE=official \
  INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
INTERACT_RAW_NONCE="$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"
printf '%s\n' "$INTERACT_RAW_NONCE" > "$OUTPUT_DIR/official-run-nonce.txt"
export INTERACT_RAW_NONCE
# Keep the Accepted build and Karma command unchanged. Add a verifier-only
# reporter to the existing config so each Jasmine spec carries its real status;
# the default verbose reporter intentionally suppresses passed-test lines.
node - "$SUBJECT_DIR/packages/nimble-components/karma.conf.verbose.js" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const source = fs.readFileSync(file, 'utf8');
if (!source.includes('module.exports = config =>')) {
  throw new Error(`Unexpected Karma verbose configuration: ${file}`);
}
if (!source.includes("'harbor-json'")) {
  fs.appendFileSync(file, `
const harborOriginalConfig = module.exports;
module.exports = config => {
  harborOriginalConfig(config);
  config.set({
    plugins: [...config.plugins, require('/tests/verifier/karma_assertion_reporter.cjs')],
    reporters: [...config.reporters, 'harbor-json'],
  });
};
`);
}
NODE
cd "$SUBJECT_DIR"
set +e
bash -lc 'npm run build-components -w packages/nimble-components && npm run test-chrome:verbose -w packages/nimble-components' >"$OUTPUT_DIR/official-command.log" 2>&1
status=$?
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

node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
