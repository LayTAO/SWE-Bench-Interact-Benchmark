#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f /tooling/.interactrepair-ready ]]; then
  npm ci --prefix /tooling --no-audit --no-fund
  touch /tooling/.interactrepair-ready
fi

# Keep the canonical app root outside the output cache.  Vite 5 treats an
# app copied under its own outDir as a relative asset source and emits an
# invalid ../../logs/... filename; the app is already mounted read-only at
# /oracle and only the generated dist belongs in /state-cache.
REPRO_APP_ROOT=/oracle /tooling/node_modules/.bin/vite build --config /oracle/vite.config.mjs > /results/build.log 2>&1
REPRO_APP_ROOT=/oracle /tooling/node_modules/.bin/vite preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT

ready=0
for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then tail -200 /results/server.log >&2; exit 20; fi

CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome \
  /tooling/node_modules/.bin/playwright test --config=/canonical-browser-tests/playwright.config.ts
