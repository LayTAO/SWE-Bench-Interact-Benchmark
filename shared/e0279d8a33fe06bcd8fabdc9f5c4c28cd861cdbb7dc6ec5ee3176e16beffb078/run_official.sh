#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
node - "$SUBJECT_DIR" "$OUTPUT_DIR/official-apply.json" <<'NODE'
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const [subject, output] = process.argv.slice(2);
const target = 'src/cdk/scrolling/virtual-scroll-viewport.spec.ts';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
fs.writeFileSync(output, `${JSON.stringify({
  applied: true, target,
  official_test_patch_sha256: hash(fs.readFileSync('/tests/verifier/official_test.patch')),
  post_apply_target_sha256: hash(fs.readFileSync(path.join(subject, target))),
}, null, 2)}\n`);
NODE
# This legacy @bazel/concatjs launcher treats an enabled user-namespace sysctl
# as sufficient for Chrome sandboxing, but Chromium still rejects sandbox mode
# when the verifier runs as root. Route root containers through the launcher's
# existing CustomChromeWithoutSandbox branch without changing any test code.
node - "$SUBJECT_DIR" <<'NODE'
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const configs = [
  'node_modules/@bazel/concatjs/web_test/karma.conf.js',
  'node_modules/@angular/dev-infra-private/node_modules/@bazel/concatjs/web_test/karma.conf.js',
];
const needle = "    if (process.platform === 'linux') {";
const replacement = `${needle}\n      if (typeof process.getuid === 'function' && process.getuid() === 0) return false;`;
for (const relative of configs) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(replacement)) continue;
  if (!source.includes(needle)) throw new Error(`sandbox detection not found in ${file}`);
  fs.writeFileSync(file, source.replace(needle, replacement));
}
const manifests = [
  'node_modules/@angular/dev-infra-private/bazel/browsers/chromium/chromium.json',
  'node_modules/.cache/bazel-output/external/npm/@angular/dev-infra-private/bazel/browsers/chromium/chromium.json',
  'node_modules/.cache/bazel-output/external/npm/node_modules/@angular/dev-infra-private/bazel/browsers/chromium/chromium.json',
  'node_modules/.cache/bazel-output/execroot/angular_material/external/npm/@angular/dev-infra-private/bazel/browsers/chromium/chromium.json',
  'node_modules/.cache/bazel-output/execroot/angular_material/external/npm/node_modules/@angular/dev-infra-private/bazel/browsers/chromium/chromium.json',
  'node_modules/.cache/bazel-output/execroot/angular_material/node_modules/@angular/dev-infra-private/bazel/browsers/chromium/chromium.json',
  'node_modules/.cache/bazel-output/external/io_bazel_rules_webtesting/browsers/chromium-local.json',
  'node_modules/.cache/bazel-output/execroot/angular_material/external/io_bazel_rules_webtesting/browsers/chromium-local.json',
];
for (const relative of manifests) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const options = data.capabilities['goog:chromeOptions'];
  options.args = [...new Set([...(options.args || []), '--no-sandbox'])];
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
NODE
node /tests/verifier/install_karma_reporter.cjs "$SUBJECT_DIR"
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
# The verifier image preloads Bazel 5.0.0 into this task-local Bazelisk cache.
# Keep official tests on that frozen cache so no-network verification never
# falls back to downloading Bazel into the container user's default cache.
export BAZELISK_HOME="$SUBJECT_DIR/node_modules/.cache/bazelisk"
export BAZEL_OUTPUT_BASE="$SUBJECT_DIR/node_modules/.cache/bazel-output"
cd "$SUBJECT_DIR"
# Rebuild after applying the official test patch, then amend only the generated
# browser capability metadata. This avoids stale Bazel action outputs selecting
# sandboxed Chrome in a root verifier container.
bash -lc 'yarn -s bazel --output_base="$BAZEL_OUTPUT_BASE" build //src/cdk/scrolling:unit_tests_chromium'
node - "$BAZEL_OUTPUT_BASE" <<'NODE'
const fs = require('fs');
const path = require('path');
const outputBase = process.argv[2];
const metadata = path.join(
  outputBase,
  'execroot/angular_material/bazel-out/k8-fastbuild/bin/src/cdk/scrolling/unit_tests_chromium.gen.json',
);
const data = JSON.parse(fs.readFileSync(metadata, 'utf8'));
const options = data.capabilities['goog:chromeOptions'];
if (!(options.args || []).includes('--no-sandbox')) {
  throw new Error(`generated browser metadata lacks --no-sandbox: ${metadata}`);
}
NODE
capture_nonce="$(node -e "process.stdout.write(require('crypto').randomBytes(16).toString('hex'))")"
printf '%s\n' "$capture_nonce" > "$OUTPUT_DIR/official-run-nonce.txt"
export INTERACT_REPORT_NONCE="$capture_nonce"
set +e
bash -lc 'yarn -s bazel --output_base="$BAZEL_OUTPUT_BASE" test //src/cdk/scrolling:unit_tests_chromium --nocache_test_results --test_output=all --test_env=INTERACT_REPORT_NONCE --test_env=INTERACT_RAW_RESULT'
status=$?
set -e
test_xml="$BAZEL_OUTPUT_BASE/execroot/angular_material/bazel-out/k8-fastbuild/testlogs/src/cdk/scrolling/unit_tests_chromium/test.xml"
[[ ! -f "$test_xml" ]] || cp "$test_xml" "$OUTPUT_DIR/official.test.xml"
# Bazel's test.xml contains one wrapper testcase for the whole Karma suite.
# The reporter writes direct per-spec output, and archives a second copy under
# TEST_UNDECLARED_OUTPUTS_DIR (which older Bazel versions package as a ZIP).
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status" "$capture_nonce"
