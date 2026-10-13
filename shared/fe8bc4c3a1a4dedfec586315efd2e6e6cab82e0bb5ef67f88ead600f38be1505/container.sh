#!/usr/bin/env bash
set -euo pipefail
if [[ ! -x /tooling/node_modules/.bin/playwright ]]; then
  if [[ -f /oracle/tooling/package-lock.json ]]; then npm ci --prefix /tooling --no-audit --no-fund; else npm install --prefix /tooling --no-audit --no-fund; fi
fi
export CI=1
export PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
APP_DIR=/state-cache/app
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/vendor"
cp -R /oracle/app/. "$APP_DIR/"
cp /subject-artifact "$APP_DIR/vendor/subject.tgz"
node - "$APP_DIR/package.json" <<'JS'
const fs = require('fs')
const path = process.argv[2]
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'))
pkg.dependencies = {...pkg.dependencies, '@react-aria/combobox': 'file:./vendor/subject.tgz'}
pkg.overrides = {'@react-aria/combobox': 'file:./vendor/subject.tgz'}
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n')
JS
cd "$APP_DIR"
rm -rf "$APP_DIR/node_modules"
cp -a /canonical-app/node_modules "$APP_DIR/node_modules"
rm -rf "$APP_DIR/node_modules/@react-aria/combobox"
mkdir -p "$APP_DIR/node_modules/@react-aria/combobox"
tar -xzf "$SUBJECT_ARTIFACT" -C "$APP_DIR/node_modules/@react-aria/combobox" --strip-components=1
npx vite --host 0.0.0.0 --port 4173 > /results/server.log 2>&1 &
server_pid=$!
cleanup() { kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; }
trap cleanup EXIT HUP INT TERM
for _ in $(seq 1 120); do curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:4173/ >/dev/null
/usr/bin/node /tooling/node_modules/@playwright/test/cli.js test /oracle/playwright/scenario.spec.ts --config=/oracle/playwright/playwright.config.ts
