#!/usr/bin/env bash
set -euo pipefail

for candidate in /opt/homebrew/bin /usr/local/bin; do
  if [[ -x "${candidate}/node" ]]; then
    export PATH="${candidate}:${PATH}"
    break
  fi
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/../app" && pwd)"
MODE="${1:-test}"

cd "${APP_DIR}"
if [[ ! -d node_modules ]]; then
  echo "canonical repro dependencies were not baked into the verifier image" >&2
  exit 1
fi

case "${MODE}" in
  test)
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
