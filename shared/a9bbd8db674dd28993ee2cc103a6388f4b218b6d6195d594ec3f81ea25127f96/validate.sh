#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh buggy|fixed|patched}"
case "$MODE" in buggy|fixed|patched) ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?prepared candidate source is required}"
: "${OUTPUT_DIR:?output directory is required}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$SUBJECT_DIR/packages/react/.harbor-canonical-repro"
mkdir -p "$APP" "$OUTPUT_DIR"
cp -a "$ROOT/app/." "$APP/"
export REPRO_MODE="$MODE" SUBJECT_DIR OUTPUT_DIR
if [[ -z "${CHROMIUM_EXECUTABLE:-}" ]]; then
  CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -path '*/chrome-linux64/chrome' -print -quit)"
fi
export CHROMIUM_EXECUTABLE
[[ -x "$CHROMIUM_EXECUTABLE" ]]
cd "$SUBJECT_DIR"
bash "$ROOT/scripts/build.sh"
node_modules/.bin/vite preview --config "$APP/vite.config.mjs" >"$OUTPUT_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
ready=false
for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:4173/ >/dev/null; then ready=true; break; fi
  sleep 1
done
[[ "$ready" == true ]]
node_modules/.bin/playwright test --config "$APP/playwright.config.cjs"
node /tests/verifier/check-canonical.cjs "$OUTPUT_DIR" "$MODE"
