#!/usr/bin/env bash
set -euo pipefail
if [[ ! -d /tooling/node_modules/playwright && ! -d /tooling/node_modules/playwright-core ]]; then
  npm install --prefix /tooling --no-audit --no-fund
fi

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
case "$REPRO_VARIANT" in
  buggy|fixed|gold|patched) ;;
  *) echo "unsupported reproduction variant: $REPRO_VARIANT" >&2; exit 2 ;;
esac
# Harbor has already prepared the exact base plus the candidate patch in this
# disposable subject checkout. Do not switch to the legacy repository commit:
# that Git tree is absent from the verifier's synthetic checkout, and a
# checkout would discard the candidate whose behavior we must observe.
if [[ ! -x /subject/node_modules/.bin/rollup ]]; then
  yarn install --frozen-lockfile --ignore-scripts --ignore-engines
fi
if [[ ! -f /subject/node_modules/node-sass/vendor/linux-x64-93/binding.node ]]; then
  npm rebuild node-sass --ignore-scripts=false
fi
# The same mounted subject is used for both modes. Rebuild the package after
# switching commits so an ignored build directory cannot leak the other mode.
rm -rf polaris-react/build polaris-icons/build polaris-tokens/build
yarn workspace @shopify/polaris-tokens build
yarn workspace @shopify/polaris-icons build
yarn workspace @shopify/polaris build:js
cd /oracle
mkdir -p node_modules
ln -sfn /tooling/node_modules/react-refresh node_modules/react-refresh
ln -sfn /tooling/node_modules/@babel node_modules/@babel
/usr/bin/node /tooling/node_modules/vite/bin/vite.js build --config /oracle/vite.config.mjs > /results/build.log 2>&1
/usr/bin/node /tooling/node_modules/vite/bin/vite.js preview --config /oracle/vite.config.mjs --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &

server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
ready=0
for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then tail -200 /results/server.log >&2; exit 20; fi
CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome /usr/bin/node /tooling/capture.mjs "IR-M-088" "$REPRO_VARIANT" http://127.0.0.1:4173 /results
