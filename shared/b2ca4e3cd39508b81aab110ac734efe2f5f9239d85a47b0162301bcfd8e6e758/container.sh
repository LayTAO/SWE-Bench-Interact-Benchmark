#!/usr/bin/env bash
set -euo pipefail
cd /oracle
if [[ ! -d /oracle/node_modules ]]; then
  npm install --no-audit --no-fund --cache /cache/npm >/results/npm-install.log 2>&1
fi
npx vite build --config /oracle/vite.config.ts >/results/build.log 2>&1
npx vite preview --host 0.0.0.0 --port 4173 >/results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 120); do
    curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1 && break
    sleep 1
done
curl -fsS http://127.0.0.1:4173 >/dev/null
npx playwright test /oracle/scenario.spec.ts --config=/oracle/playwright.config.ts --reporter=line
