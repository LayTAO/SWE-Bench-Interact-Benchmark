#!/usr/bin/env bash
set -euo pipefail

for package in vite playwright-core @vitejs/plugin-react; do
  test -e "/tooling/node_modules/$package" || { echo "missing baked canonical dependency: $package" >&2; exit 2; }
done

/tooling/node_modules/.bin/vite build --config /oracle/vite.config.mjs > /results/build.log 2>&1
/tooling/node_modules/.bin/vite preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4175 > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do
  curl -fsS http://127.0.0.1:4175 >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS http://127.0.0.1:4175 >/dev/null
CHROMIUM_EXECUTABLE="${CHROMIUM_EXECUTABLE:-$(find /ms-playwright -type f -path '*/chrome-linux*/chrome' -print -quit 2>/dev/null || true)}" \
  node /tooling/capture.mjs "$INSTANCE_ID" "$REPRO_VARIANT" http://127.0.0.1:4175 /results
