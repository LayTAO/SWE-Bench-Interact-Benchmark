#!/usr/bin/env bash
set -euo pipefail
if [[ ! -d /tooling/node_modules/playwright && ! -d /tooling/node_modules/playwright-core ]]; then npm install --prefix /tooling --no-audit --no-fund; fi
if [[ ! -e /oracle/node_modules ]]; then ln -s /subject/node_modules /oracle/node_modules; fi
cd /oracle
/subject/node_modules/.bin/ng build oracle --configuration development --no-progress > /results/build.log 2>&1
python3 -m http.server 4173 --directory /state-cache/dist/browser > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173 >/dev/null
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome node /tooling/capture.mjs "$INSTANCE_ID" "$REPRO_VARIANT" http://127.0.0.1:4173 /results
