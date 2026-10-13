#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
cp /tests/verifier/p2p_controls.json "$OUTPUT_DIR/official-p2p-controls.json"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
node - "$SUBJECT_DIR" "$OUTPUT_DIR/official-apply.json" <<'NODE'
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const [subject, output] = process.argv.slice(2);
const target = 'src/material/sidenav/drawer.spec.ts';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
fs.writeFileSync(output, `${JSON.stringify({
  applied: true, target,
  official_test_patch_sha256: hash(fs.readFileSync('/tests/verifier/official_test.patch')),
  post_apply_target_sha256: hash(fs.readFileSync(path.join(subject, target))),
}, null, 2)}\n`);
NODE
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
export BAZELISK_HOME="$SUBJECT_DIR/node_modules/.cache/bazelisk"
export BAZEL_OUTPUT_BASE="$SUBJECT_DIR/node_modules/.cache/bazel-output"

# This repository revision's devinfra esbuild wrapper enables its custom
# bazel-sandbox resolver before applying the declared tsconfig.  That resolver
# cannot resolve the workspace-local @angular/cdk entry points even though the
# corresponding Bazel outputs are declared inputs.  Apply the verifier-owned
# build-only compatibility patch and point esbuild at this subject's bin tree.
# The ordinary Bazel processwrapper sandbox and Harbor no-network boundary stay
# enabled; production sources and official assertions are unchanged.
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_build_compat.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_build_compat.patch
BAZEL_BIN_ROOT="$BAZEL_OUTPUT_BASE/execroot/_main/bazel-out/k8-fastbuild/bin"
sed -i "s#__HARBOR_BAZEL_BIN_ROOT__#$BAZEL_BIN_ROOT#g" \
  "$SUBJECT_DIR/tools/bazel/web_test_suite.bzl"
node /tests/verifier/install_wtr_reporter.cjs "$BAZEL_OUTPUT_BASE"
cd "$SUBJECT_DIR"
capture_nonce="$(node -e "process.stdout.write(require('crypto').randomBytes(16).toString('hex'))")"
printf '%s\n' "$capture_nonce" > "$OUTPUT_DIR/official-run-nonce.txt"
export INTERACT_REPORT_NONCE="$capture_nonce"
set +e
bash -lc 'pnpm exec bazel --output_base="$BAZEL_OUTPUT_BASE" test //src/material/sidenav:unit_tests_chromium --nocache_test_results --test_output=all --test_env=INTERACT_REPORT_NONCE --test_env=INTERACT_RAW_RESULT'
status=$?
set -e
test_xml="$(find "$BAZEL_OUTPUT_BASE/execroot" -path '*/testlogs/src/material/sidenav/unit_tests_chromium/test.xml' -type f -print -quit 2>/dev/null)"
[[ -z "$test_xml" || ! -f "$test_xml" ]] || cp "$test_xml" "$OUTPUT_DIR/official.test.xml"
# Bazel XML is only the wrapper. WTR writes real Jasmine assertion outcomes
# directly to the verifier result path and also to Bazel's undeclared outputs.
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status" "$capture_nonce" \
  /tests/verifier/p2p_controls.json
