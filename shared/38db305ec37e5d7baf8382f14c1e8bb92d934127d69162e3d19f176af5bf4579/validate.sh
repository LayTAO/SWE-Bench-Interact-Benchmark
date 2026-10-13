#!/usr/bin/env bash
set -euo pipefail
REQUESTED_MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$REQUESTED_MODE" in
  buggy|fixed) MODE="$REQUESTED_MODE" ;;
  patched) MODE=fixed ;;
  *) exit 2 ;;
esac
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORACLE_DIR="$OUTPUT_DIR/oracle"
TOOLING_DIR="$OUTPUT_DIR/tooling"
RESULTS_DIR="$OUTPUT_DIR/results"
mkdir -p "$ORACLE_DIR" "$TOOLING_DIR" "$RESULTS_DIR" "$OUTPUT_DIR/state-cache"
cp -R "$ROOT/app/." "$ORACLE_DIR/"
cp "$ROOT/tooling/package.json" "$ROOT/tooling/capture.mjs" "$ROOT/tooling/legacy-react.mjs" "$TOOLING_DIR/"
if [[ -d "$ROOT/tooling/node_modules" ]]; then
  cp -a "$ROOT/tooling/node_modules" "$TOOLING_DIR/"
else
  npm install --prefix "$TOOLING_DIR" --no-audit --no-fund --prefer-offline
fi
ln -sfn "$SUBJECT_DIR" /subject
# The app and its config live in the same canonical root.  Older revisions
# linked /oracle to the reproduction parent, which made the direct Vite
# runner look for /oracle/vite.config.mjs one directory too high.
ln -sfn "$ORACLE_DIR" /oracle
ln -sfn "$TOOLING_DIR" /tooling
cd /oracle
export IR_RUNTIME_ORACLE="$ORACLE_DIR"
export IR_STATE_CACHE="$OUTPUT_DIR/state-cache"
/tooling/node_modules/.bin/vite build --config "$ORACLE_DIR/vite.config.mjs" >"$RESULTS_DIR/build.log" 2>&1
/tooling/node_modules/.bin/vite preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 >"$RESULTS_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for _ in $(seq 1 180); do curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173/ >/dev/null
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome node /tooling/capture.mjs IR-M-077 "$MODE" http://127.0.0.1:4173 "$RESULTS_DIR"
node -e 'const fs=require("fs"); const d=JSON.parse(fs.readFileSync(process.argv[1])); const passed=d.oracle_passed === true; if ((process.argv[2] === "buggy" && passed) || (process.argv[2] === "fixed" && !passed)) process.exit(9)' "$RESULTS_DIR/observation.json" "$MODE"
