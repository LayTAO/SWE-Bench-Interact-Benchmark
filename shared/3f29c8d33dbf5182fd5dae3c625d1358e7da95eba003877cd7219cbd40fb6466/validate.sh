#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$MODE" in buggy|fixed) ;; patched) MODE=fixed ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULTS_DIR="$OUTPUT_DIR/results"
mkdir -p "$RESULTS_DIR"
APP_DIR="$SUBJECT_DIR/.harbor-canonical-repro"
rm -rf "$APP_DIR"
cp -R "$ROOT/app" "$APP_DIR"
ln -s "$SUBJECT_DIR/examples/next-ts/node_modules" "$APP_DIR/node_modules"

PORT="${IR_CANONICAL_PORT:-4173}"
(
  cd "$SUBJECT_DIR"
  exec "$SUBJECT_DIR/node_modules/.bin/vite" --config "$APP_DIR/vite.config.mjs" --host 127.0.0.1 --port "$PORT"
) >"$RESULTS_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT

url="http://127.0.0.1:$PORT/"
ready=false
for _ in $(seq 1 120); do
  if curl -fsS "$url" >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  cat "$RESULTS_DIR/server.log" >&2
  exit 1
fi

if [[ -z "${CHROMIUM_EXECUTABLE:-}" ]]; then
  CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -path '*/chrome-linux64/chrome' -perm -u+x -print | sort -V | tail -1)"
fi
[[ -n "$CHROMIUM_EXECUTABLE" && -x "$CHROMIUM_EXECUTABLE" ]]
CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" \
  node "$ROOT/tooling/capture.mjs" "$MODE" "$url" "$RESULTS_DIR"
cp "$RESULTS_DIR/observation.json" "$OUTPUT_DIR/observation.json"
