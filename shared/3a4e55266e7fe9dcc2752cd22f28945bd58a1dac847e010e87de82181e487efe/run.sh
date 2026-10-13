#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/../app" && pwd)"
MODE="${1:-test}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required" >&2
  exit 2
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 20 )); then
  echo "Node.js 20 or newer is required; found $(node --version)" >&2
  exit 2
fi

cd "${APP_DIR}"
if [[ ! -d node_modules ]]; then
  npm install
fi

case "${MODE}" in
  test)
    npx playwright install chromium
    npm run test:e2e
    ;;
  serve)
    npm run dev
    ;;
  *)
    echo "Usage: bash $0 [test|serve]" >&2
    exit 2
    ;;
esac
