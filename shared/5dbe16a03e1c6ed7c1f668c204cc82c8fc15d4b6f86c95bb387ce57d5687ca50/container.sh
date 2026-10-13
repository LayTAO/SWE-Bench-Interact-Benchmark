#!/usr/bin/env bash
set -euo pipefail

if [[ ! -d /tooling/node_modules/playwright-core ]]; then
  npm install --prefix /tooling --no-audit --no-fund
fi

export SUBJECT_DIR=/subject
/tooling/node_modules/.bin/vite --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 \
  > /results/vite.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT

for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:4173 >/dev/null

SUBJECT_DIR=/subject OUTPUT_DIR=/results \
  CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome \
  node /oracle/run.cjs
