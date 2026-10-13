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
: "${CHROMIUM_EXECUTABLE:?CHROMIUM_EXECUTABLE is required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_SOURCE="$ROOT/app"
TOOLING_SOURCE="$ROOT/tooling"
RUNTIME_APP="$OUTPUT_DIR/app"
TOOLING_DIR="$OUTPUT_DIR/tooling"
mkdir -p "$RUNTIME_APP" "$TOOLING_DIR/results"
cp -R "$APP_SOURCE/." "$RUNTIME_APP/"
cp "$TOOLING_SOURCE/package.json" "$TOOLING_SOURCE/capture.mjs" "$TOOLING_DIR/"
if [[ ! -d "$TOOLING_DIR/node_modules/playwright" ]]; then npm install --prefix "$TOOLING_DIR" --no-audit --no-fund --prefer-offline; fi
cd "$SUBJECT_DIR"
"$SUBJECT_DIR/node_modules/.bin/vite" "$RUNTIME_APP" --config "$RUNTIME_APP/vite.config.mjs" --host 127.0.0.1 --port 4173 --strictPort >"$OUTPUT_DIR/vite.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for _ in $(seq 1 120); do curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173/ >/dev/null
CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" node "$TOOLING_DIR/capture.mjs" "$MODE" http://127.0.0.1:4173/ "$TOOLING_DIR/results"
