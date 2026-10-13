#!/usr/bin/env bash
set -euo pipefail
[[ -d /tooling/node_modules/playwright || -d /tooling/node_modules/playwright-core ]] || {
  echo 'preinstalled canonical tooling is missing; refusing runtime network install' >&2
  exit 21
}
cd /subject
if [[ ! -f config/typescript-config-carbon/dist/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace typescript-config-carbon build
fi
if [[ ! -f packages/feature-flags/es/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/feature-flags build
fi
if [[ ! -f packages/icons/metadata.json ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons build
fi
if [[ ! -f packages/icon-helpers/dist/index.js && ! -f packages/icon-helpers/es/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icon-helpers build
fi
if [[ ! -f packages/layout/scss/generated/_fluid-spacing.scss ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/layout build
fi
if [[ ! -f packages/colors/es/index.js && ! -f packages/colors/lib/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/colors build || true
fi
if [[ ! -f packages/utilities/es/index.js && ! -f packages/utilities/lib/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/utilities build || true
fi
if [[ ! -f packages/type/es/index.js && ! -f packages/type/lib/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/type build || true
fi
if [[ ! -f packages/motion/es/index.js && ! -f packages/motion/lib/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/motion build || true
fi
if [[ ! -d packages/grid/scss/_inlined ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/grid build || true
fi
if [[ ! -f packages/themes/es/index.js && ! -f packages/themes/lib/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/themes build || true
fi
if [[ ! -f packages/icons-react/es/index.js ]]; then
  node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons-react build
fi
cd /oracle
/tooling/node_modules/.bin/vite build --config /oracle/vite.config.mjs > /results/build.log 2>&1
/tooling/node_modules/.bin/vite preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173 >/dev/null
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome node /tooling/capture.mjs "$INSTANCE_ID" "$REPRO_VARIANT" http://127.0.0.1:4173 /results
