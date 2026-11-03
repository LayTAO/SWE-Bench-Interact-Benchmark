#!/usr/bin/env bash
set -euo pipefail
[[ -x /tooling/node_modules/.bin/playwright ]] || { echo "Frozen Playwright tooling is missing" >&2; exit 1; }
export CI=1
export PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
APP_DIR=/state-cache/app
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
cp -R /oracle/app/. "$APP_DIR/"
cd "$APP_DIR"
rm -rf "$APP_DIR/node_modules"
cp -a /canonical-app/node_modules "$APP_DIR/node_modules"
node "$APP_DIR/candidate-workspace.mjs" "$SUBJECT_DIR" /results > /results/candidate-source.sha256
node "$APP_DIR/node_modules/vite/bin/vite.js" --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
cleanup() { kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; }
trap cleanup EXIT HUP INT TERM
for _ in $(seq 1 120); do curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173/ >/dev/null
/usr/bin/node /tooling/node_modules/@playwright/test/cli.js test /oracle/playwright/scenario.spec.ts --config=/oracle/playwright/playwright.config.ts
