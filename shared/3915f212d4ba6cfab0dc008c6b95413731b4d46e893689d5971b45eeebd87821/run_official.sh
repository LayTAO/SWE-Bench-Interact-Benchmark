#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch
git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch
cp /tests/verifier/interactrepair-wtr.config.mjs "$SUBJECT_DIR/packages/web-components/.interactrepair-wtr.config.mjs"
# The React accessibility matcher asks accessibility-checker for its rule
# archive at cdn.jsdelivr.net. Official verification runs with --network=none,
# so serve the identical engine bundled in the verifier image locally instead
# of making the result depend on an external CDN.
AC_RULE_ROOT=/tmp/interactrepair-ac-rules
AC_RULE_PORT=8765
rm -rf "$AC_RULE_ROOT"
mkdir -p "$AC_RULE_ROOT/v4.0.17/js"
cp /workspace/repo/node_modules/accessibility-checker-engine/ace.js "$AC_RULE_ROOT/v4.0.17/js/ace.js"
cp /workspace/repo/node_modules/accessibility-checker-engine/ace-node.js "$AC_RULE_ROOT/v4.0.17/js/ace-node.js"
printf '%s\n' '[{"id":"latest","name":"Local bundled rules","path":"/v4.0.17","version":"4.0.17"}]' > "$AC_RULE_ROOT/archives.json"
python3 - "$AC_RULE_PORT" "$AC_RULE_ROOT" >"/logs/verifier/ac-ruleserver.log" 2>&1 <<'PY' &
import functools
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class CorsHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()


port, directory = sys.argv[1:]
server = ThreadingHTTPServer(('127.0.0.1', int(port)), functools.partial(CorsHandler, directory=directory))
server.serve_forever()
PY
AC_RULE_SERVER_PID=$!
trap 'kill "$AC_RULE_SERVER_PID" 2>/dev/null || true' EXIT
printf '%s\n' 'ruleArchive: latest' 'ruleServer: http://127.0.0.1:8765' > "$SUBJECT_DIR/.achecker.yml"
export CI=true PLAYWRIGHT_BROWSERS_PATH=/ms-playwright INTERACT_RAW_RESULT="$OUTPUT_DIR/official.raw.json"
cd "$SUBJECT_DIR"
set +e
bash -lc 'node .yarn/releases/yarn-4.10.3.cjs workspace typescript-config-carbon build && node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons build && if [[ -d packages/icon-helpers ]]; then node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icon-helpers build; fi && node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons-react build && node .yarn/releases/yarn-4.10.3.cjs workspaces foreach --recursive --topological --from @carbon/react --exclude @carbon/react run build && node .yarn/releases/yarn-4.10.3.cjs test packages/react/src/components/MultiSelect/__tests__/MultiSelect-test.js --runInBand --testNamePattern="should move focus to the next control when the user tabs away with the menu open|should accept a .*ref.* for the underlying button element|should apply floating styles when .*autoAlign.* is enabled|should call onChange when the selection changes from user selection" --json --outputFile=/logs/verifier/official.raw.json'
status=$?
set -e
if [[ ! -s "$OUTPUT_DIR/official.raw.json" ]]; then
  printf '{"exit_code":%s,"testResults":[]}\n' "$status" > "$OUTPUT_DIR/official.raw.json"
fi
node /tests/verifier/summarize_official.cjs \
  "$OUTPUT_DIR/official.raw.json" /tests/verifier/evaluator.json \
  "$OUTPUT_DIR/official.json" "$status"
