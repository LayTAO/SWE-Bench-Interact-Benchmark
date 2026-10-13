#!/usr/bin/env bash
set -euo pipefail

: "${EXPECT_BUG:?EXPECT_BUG is required}"
: "${REPRO_MODE:?REPRO_MODE is required}"

# Tooling is installed in the Verifier image from the pinned lockfile.  Do not
# perform a network install at runtime: the Verifier is intentionally
# no-network and the canonical check must be repeatable.
[[ -x /tooling/node_modules/.bin/playwright ]] || {
  echo "pinned Playwright tooling is missing from the Verifier image" >&2
  exit 21
}

export CI=1
export PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
app_dir=/state-cache/app
mkdir -p "$app_dir"
cp -R /oracle/app/. "$app_dir/"
if [[ ! -e "$app_dir/node_modules" ]]; then
  ln -s /subject/node_modules "$app_dir/node_modules"
fi
cd "$app_dir"
node /subject/node_modules/parcel/lib/bin.js index.html \
  --config "$app_dir/.parcelrc" \
  --host 127.0.0.1 \
  --port 4173 \
  --dist-dir /state-cache/dist \
  --no-cache > /results/server.log 2>&1 &
server_pid=$!

cleanup() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM

ready=0
for _ in $(seq 1 120); do
  if curl -fsS http://127.0.0.1:4173 >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then
  tail -200 /results/server.log >&2
  exit 20
fi

export CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
/usr/bin/node /tooling/node_modules/@playwright/test/cli.js test \
  /oracle/playwright/scenario.spec.ts \
  --config=/oracle/playwright/playwright.config.ts
