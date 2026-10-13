#!/usr/bin/env bash
set -euo pipefail
if [[ ! -d /tooling/node_modules/playwright && ! -d /tooling/node_modules/playwright-core ]]; then npm install --prefix /tooling --no-audit --no-fund; fi
if [[ -f /subject/pnpm-lock.yaml && ! -d /subject/node_modules ]]; then
  if ! command -v pnpm >/dev/null 2>&1 && command -v corepack >/dev/null 2>&1; then
    corepack enable
  fi
  if ! command -v pnpm >/dev/null 2>&1; then
    npm install --global --no-audit --no-fund pnpm@8.7.0
  fi
  pnpm --dir /subject install --frozen-lockfile --ignore-scripts
fi
rm -rf /tmp/heroui-canonical-app
mkdir -p /tmp/heroui-canonical-app
cp -a /oracle/. /tmp/heroui-canonical-app/
export REPRO_APP_ROOT=/tmp/heroui-canonical-app
/tooling/node_modules/.bin/vite build --config /oracle/vite.config.mjs > /results/build.log 2>&1
/tooling/node_modules/.bin/vite preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173 >/dev/null
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome node /tooling/capture.mjs "$INSTANCE_ID" "$REPRO_VARIANT" http://127.0.0.1:4173 /results
