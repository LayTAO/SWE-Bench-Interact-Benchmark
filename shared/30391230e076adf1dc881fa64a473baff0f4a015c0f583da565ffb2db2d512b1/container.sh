#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f /tooling/.interactrepair-ready ]]; then
  npm ci --prefix /tooling --no-audit --no-fund
  touch /tooling/.interactrepair-ready
fi

mkdir -p /state-cache/app
cp -R /oracle/. /state-cache/app/
REPRO_APP_ROOT=/state-cache/app /tooling/node_modules/.bin/vite build --config /state-cache/app/vite.config.mjs > /results/build.log 2>&1
REPRO_APP_ROOT=/state-cache/app /tooling/node_modules/.bin/vite preview --config /state-cache/app/vite.config.mjs --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT

ready=0
for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then tail -200 /results/server.log >&2; exit 20; fi

CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome \
  /tooling/node_modules/.bin/playwright test --config=/tests/playwright.config.ts
