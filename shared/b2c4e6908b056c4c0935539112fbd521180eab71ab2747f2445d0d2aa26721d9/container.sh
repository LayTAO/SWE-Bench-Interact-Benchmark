#!/usr/bin/env bash
set -euo pipefail
cd /subject
if [[ ! -d /tooling/node_modules/playwright ]]; then
  npm install --prefix /tooling --no-audit --no-fund --cache /state-cache/npm playwright@1.58.2 >/results/playwright-install.log 2>&1
fi
if [[ ! -d /subject/packages/nimble-tokens/dist/icons/js ]]; then
  npm run build --workspace @ni/nimble-tokens >/results/tokens-build.log 2>&1
fi
if [[ ! -d /subject/packages/jasmine-parameterized/dist/esm ]]; then
  npm run build --workspace @ni/jasmine-parameterized >/results/jasmine-parameterized-build.log 2>&1
fi
if [[ ! -d /subject/packages/nimble-components/dist/esm/select ]]; then
  npm run build --workspace @ni/nimble-components >/results/subject-build.log 2>&1
fi
(cd /subject && ./node_modules/.bin/vite --config /app/vite.config.mjs --host 0.0.0.0 --port 4174) >/results/vite.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT INT TERM
for attempt in $(seq 1 120); do
  curl -fsS http://127.0.0.1:4174 >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS http://127.0.0.1:4174 >/dev/null
PLAYWRIGHT_MODULE=/tooling/node_modules/playwright node /app/run.mjs
