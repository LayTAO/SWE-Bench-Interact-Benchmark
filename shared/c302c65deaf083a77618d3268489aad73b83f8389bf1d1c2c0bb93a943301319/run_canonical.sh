#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/workspace/canonical-app
STATE_DIR=/workspace/canonical-state
RESULTS_DIR=/results
rm -rf "$APP_DIR" "$STATE_DIR" "$RESULTS_DIR"
mkdir -p "$APP_DIR" "$STATE_DIR" "$RESULTS_DIR"
if [[ -e /subject || -L /subject ]]; then
  echo "canonical verifier: /subject already exists" >&2
  exit 1
fi
if [[ -e /state-cache || -L /state-cache ]]; then
  echo "canonical verifier: /state-cache already exists" >&2
  exit 1
fi
ln -s /workspace/subject /subject
ln -s "$STATE_DIR" /state-cache
cp -R /tests/playwright/app/. "$APP_DIR/"

REPRO_APP_ROOT="$APP_DIR" \
  /tooling/node_modules/.bin/vite build --config "$APP_DIR/vite.config.mjs" \
  > /logs/verifier/canonical/build.log 2>&1

REPRO_APP_ROOT="$APP_DIR" \
  /tooling/node_modules/.bin/vite preview --config "$APP_DIR/vite.config.mjs" \
  --host 0.0.0.0 --port 4173 \
  > /logs/verifier/canonical/server.log 2>&1 &
server_pid=$!
cleanup() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM

ready=0
for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  tail -200 /logs/verifier/canonical/server.log >&2 || true
  exit 20
fi

EXPECT_BUG=false \
  REPRO_MODE=patched \
  CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome \
  /tooling/node_modules/.bin/playwright test \
  /tests/playwright/scenario.spec.ts \
    --config=/tests/playwright/playwright.config.ts \
    > /logs/verifier/canonical/playwright.log 2>&1

node /tests/verifier/check_oracle.cjs \
  /results/observation.json /tests/verifier/oracle.json
