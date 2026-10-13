#!/usr/bin/env bash
set -euo pipefail
MODE="${REPRO_VARIANT:?}"
ROOT=/results/oracle
mkdir -p "$ROOT" /results/results /results/state-cache
cp -R /oracle-src/. "$ROOT/"
cd "$ROOT"
/tooling/node_modules/.bin/vite build --config "$ROOT/vite.config.ts" > /results/results/build.log 2>&1
/tooling/node_modules/.bin/vite preview --config "$ROOT/vite.config.ts" --host 0.0.0.0 --port 4173 > /results/results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
for _ in $(seq 1 180); do curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173/ >/dev/null
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome node /runner/capture.mjs "$MODE" http://127.0.0.1:4173 /results/results
