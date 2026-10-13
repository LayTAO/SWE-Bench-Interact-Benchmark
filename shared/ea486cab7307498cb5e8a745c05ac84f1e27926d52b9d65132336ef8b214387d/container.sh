#!/usr/bin/env bash
set -euo pipefail
if [[ ! -d /tooling/node_modules/playwright && ! -d /tooling/node_modules/playwright-core ]]; then npm install --prefix /tooling --no-audit --no-fund; fi
if [[ ! -d /tooling/node_modules/react-transition-group || ! -d /tooling/node_modules/@emotion/styled ]]; then
  npm install --prefix /tooling --no-save --ignore-scripts --no-audit --no-fund prop-types@15.8.1 clsx@2.1.1 react-is@19.2.4 react-transition-group@4.4.5 @popperjs/core@2.11.8 @babel/runtime@7.29.2 @emotion/cache@11.14.0 @emotion/serialize@1.3.3 @emotion/sheet@1.4.0 @emotion/react@11.14.0 @emotion/styled@11.14.1 csstype@3.2.3 >/results/dependency-install.log 2>&1
fi
ln -sfn /tooling/node_modules/prop-types /subject/node_modules/prop-types
ln -sfn /tooling/node_modules/clsx /subject/node_modules/clsx
ln -sfn /tooling/node_modules/react-is /subject/node_modules/react-is
ln -sfn /tooling/node_modules/react-transition-group /subject/node_modules/react-transition-group
mkdir -p /subject/node_modules/@popperjs
ln -sfn /tooling/node_modules/@popperjs/core /subject/node_modules/@popperjs/core
mkdir -p /subject/node_modules/@babel /subject/node_modules/@emotion
ln -sfn /tooling/node_modules/@babel/runtime /subject/node_modules/@babel/runtime
for package in cache serialize sheet; do ln -sfn "/tooling/node_modules/@emotion/$package" "/subject/node_modules/@emotion/$package"; done
for package in react styled; do ln -sfn "/tooling/node_modules/@emotion/$package" "/subject/node_modules/@emotion/$package"; done
ln -sfn /tooling/node_modules/csstype /subject/node_modules/csstype
/tooling/node_modules/.bin/vite build --config /oracle/vite.config.mjs > /results/build.log 2>&1
/tooling/node_modules/.bin/vite preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173 >/dev/null
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome node /tooling/capture.mjs "$INSTANCE_ID" "$REPRO_VARIANT" http://127.0.0.1:4173 /results
