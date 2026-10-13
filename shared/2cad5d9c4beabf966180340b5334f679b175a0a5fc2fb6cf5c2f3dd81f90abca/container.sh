#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: container.sh <buggy|fixed|patched>}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
mkdir -p /work/app /results
cp -R /oracle/app/. /work/app/
rm -rf /work/app/node_modules
ln -sfn /tooling/node_modules /work/app/node_modules
cp /oracle/playwright/scenario.spec.ts /work/app/tests/scenario.spec.ts
cd /work/app
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort >/results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:4173 >/dev/null
REPRO_MODE="$MODE" OUTPUT_DIR=/results npx playwright test tests/scenario.spec.ts --config=/work/app/playwright.config.ts
