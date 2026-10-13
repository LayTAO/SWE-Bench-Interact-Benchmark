#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SOURCE="$(cd "$SCRIPT_DIR/../app" && pwd)"
TOOLING_SOURCE="$(cd "$SCRIPT_DIR/../tooling" && pwd)"
: "${SUBJECT_DIR:?SUBJECT_DIR must be a writable exact checkout with dependencies installed}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
: "${REPRO_VARIANT:?REPRO_VARIANT must be buggy or gold}"
: "${CHROMIUM_EXECUTABLE:?CHROMIUM_EXECUTABLE must point to Chromium 145.0.7632.6}"
case "$REPRO_VARIANT" in buggy|gold) ;; *) echo "invalid REPRO_VARIANT" >&2; exit 2 ;; esac
RESULTS_DIR="$OUTPUT_DIR/results"
TOOLING_DIR="$OUTPUT_DIR/tooling"
mkdir -p "$RESULTS_DIR" "$TOOLING_DIR"
cp "$TOOLING_SOURCE/package.json" "$TOOLING_SOURCE/capture.mjs" "$TOOLING_DIR/"
if [[ -d "$TOOLING_SOURCE/node_modules/playwright" ]]; then
  cp -a "$TOOLING_SOURCE/node_modules" "$TOOLING_DIR/node_modules"
elif [[ -n "${TOOLING_NODE_MODULES_SOURCE:-}" && -d "$TOOLING_NODE_MODULES_SOURCE/playwright" ]]; then
  cp -a "$TOOLING_NODE_MODULES_SOURCE" "$TOOLING_DIR/node_modules"
elif [[ ! -d "$TOOLING_DIR/node_modules/playwright" ]]; then
  npm install --prefix "$TOOLING_DIR" --no-audit --no-fund
fi
rm -rf "$SUBJECT_DIR/.interactrepair-repro"
mkdir -p "$SUBJECT_DIR/.interactrepair-repro"
cp -R "$APP_SOURCE/." "$SUBJECT_DIR/.interactrepair-repro/"
cd "$SUBJECT_DIR"
./node_modules/.bin/parcel .interactrepair-repro/index.html --config .interactrepair-repro/.parcelrc --host 127.0.0.1 --port 4852 --no-cache >"$RESULTS_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 300); do
  if curl -fsS "http://127.0.0.1:4852" >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS "http://127.0.0.1:4852" >/dev/null
CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" node "$TOOLING_DIR/capture.mjs" IR-M-052 "$REPRO_VARIANT" "http://127.0.0.1:4852" "$RESULTS_DIR"
