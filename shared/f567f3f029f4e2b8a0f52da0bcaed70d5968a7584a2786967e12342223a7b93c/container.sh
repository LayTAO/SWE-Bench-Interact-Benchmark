#!/usr/bin/env bash
set -euo pipefail
if [[ ! -d /tooling/node_modules/playwright && ! -d /tooling/node_modules/playwright-core ]]; then npm install --prefix /tooling --no-audit --no-fund; fi

NODE_ROOT="/state-cache/node16"
if [[ ! -x "$NODE_ROOT/bin/node" ]]; then
  if [[ -x /opt/node/bin/node ]]; then
    NODE_ROOT=/opt/node
  else
    curl -L --fail --retry 3 https://nodejs.org/dist/v16.20.2/node-v16.20.2-linux-x64.tar.gz -o /state-cache/node16.tar.gz
    mkdir -p "$NODE_ROOT"
    tar -xzf /state-cache/node16.tar.gz -C "$NODE_ROOT" --strip-components=1
  fi
fi
export PATH="$NODE_ROOT/bin:$PATH"
YARN_PREFIX="/state-cache/yarn1"
if [[ ! -x "$YARN_PREFIX/bin/yarn" ]]; then
  SYSTEM_YARN="$(command -v yarn || true)"
  if [[ -n "$SYSTEM_YARN" ]]; then
    YARN_PREFIX="$(dirname "$(dirname "$SYSTEM_YARN")")"
  else
    npm install --global --prefix "$YARN_PREFIX" yarn@1.22.22
  fi
fi
export PATH="$YARN_PREFIX/bin:$NODE_ROOT/bin:$PATH"
if [[ -L /subject/node_modules ]]; then rm -f /subject/node_modules; fi
cd /subject
if [[ ! -x /subject/node_modules/.bin/rollup ]]; then
  yarn install --frozen-lockfile --ignore-scripts --ignore-engines
fi
if [[ ! -f /subject/node_modules/node-sass/vendor/linux-x64-93/binding.node ]]; then
  npm rebuild node-sass --ignore-scripts=false
fi
if [[ ! -f polaris-react/build/esm/index.js ]]; then
  yarn workspace @shopify/polaris-tokens build
  yarn workspace @shopify/polaris-icons build
  yarn workspace @shopify/polaris build:js
fi
cd /oracle
/usr/bin/node /tooling/node_modules/vite/bin/vite.js build --config /oracle/vite.config.mjs > /results/build.log 2>&1
/usr/bin/node /tooling/node_modules/vite/bin/vite.js preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173 >/dev/null
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome /usr/bin/node /tooling/capture.mjs "$INSTANCE_ID" "$REPRO_VARIANT" http://127.0.0.1:4173 /results
