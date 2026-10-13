#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$MODE" in
  buggy|fixed) ;;
  patched) MODE=fixed ;;
  *) exit 2 ;;
esac
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORACLE_DIR="$OUTPUT_DIR/oracle"; TOOLING_DIR="$OUTPUT_DIR/tooling"; RESULTS_DIR="$OUTPUT_DIR/results"
mkdir -p "$ORACLE_DIR" "$TOOLING_DIR" "$RESULTS_DIR" "$OUTPUT_DIR/state-cache"
cp -R "$ROOT/app/." "$ORACLE_DIR/"
cp "$ROOT/tooling/package.json" "$ROOT/tooling/capture.mjs" "$TOOLING_DIR/"
if [[ ! -d "$TOOLING_DIR/node_modules/playwright" ]]; then npm install --prefix "$TOOLING_DIR" --no-audit --no-fund --prefer-offline; fi
cd "$ORACLE_DIR"; export IR_RUNTIME_ORACLE="$ORACLE_DIR"; export IR_STATE_CACHE="$OUTPUT_DIR/state-cache"; export IR_SUBJECT_DIR="$SUBJECT_DIR"; export IR_VUE_PLUGIN_DIR="$ROOT/tooling/node_modules/@vitejs/plugin-vue"
ln -sfn "$SUBJECT_DIR/node_modules" "$ORACLE_DIR/node_modules"
VITE_BIN="$ROOT/tooling/node_modules/vite/bin/vite.js"
[[ -f "$VITE_BIN" ]] || VITE_BIN="$(find "$SUBJECT_DIR/node_modules/.pnpm" -path '*/node_modules/vite/bin/vite.js' -print -quit 2>/dev/null || true)"
node "$VITE_BIN" build --config "$ORACLE_DIR/vite.config.mts" >"$RESULTS_DIR/build.log" 2>&1
node "$VITE_BIN" preview --config "$ORACLE_DIR/vite.config.mts" --host 0.0.0.0 --port 4173 >"$RESULTS_DIR/server.log" 2>&1 &
server_pid=$!; trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for _ in $(seq 1 180); do curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173/ >/dev/null
CHROMIUM_EXECUTABLE="${CHROMIUM_EXECUTABLE:-/ms-playwright/chromium-1208/chrome-linux64/chrome}" node "$TOOLING_DIR/capture.mjs" "$MODE" http://127.0.0.1:4173 "$RESULTS_DIR"
node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1])); const passed=d.oracle_passed===true; if ((process.argv[2]==="buggy" && passed) || (process.argv[2]==="fixed" && !passed)) process.exit(9)' "$RESULTS_DIR/observation.json" "$MODE"
