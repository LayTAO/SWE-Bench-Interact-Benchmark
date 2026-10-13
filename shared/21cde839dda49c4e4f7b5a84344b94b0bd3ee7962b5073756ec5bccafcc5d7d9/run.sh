#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SOURCE="$(cd "${SCRIPT_DIR}/../app" && pwd)"
: "${SUBJECT_PACKAGE:?SUBJECT_PACKAGE must point to a packed reka-ui build}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
: "${REPRO_VARIANT:?REPRO_VARIANT is required}"

ENGINE="${CONTAINER_ENGINE:-$(command -v docker >/dev/null 2>&1 && echo docker || echo docker)}"
RUNTIME_DIR="${OUTPUT_DIR}/workspace/app"
RESULTS_DIR="${OUTPUT_DIR}/results"
CACHE_DIR="${OUTPUT_DIR}/npm-cache"
mkdir -p "${RUNTIME_DIR}" "${RESULTS_DIR}" "${CACHE_DIR}"
[[ -d /opt/reka-canonical-cache/npm ]] || { echo 'baked canonical npm cache is missing' >&2; exit 20; }
cp -a /opt/reka-canonical-cache/npm/. "${CACHE_DIR}/"
cp -R "${APP_SOURCE}/." "${RUNTIME_DIR}/"
cp "${SUBJECT_PACKAGE}" "${RUNTIME_DIR}/subject.tgz"

"${ENGINE}" run --rm --ipc=host \
  -e HOME=/workspace/home \
  -e npm_config_cache=/workspace/npm-cache \
  -e RESULTS_DIR=/workspace/results \
  -e REPRO_MODE="${REPRO_VARIANT}" \
  -v "${RUNTIME_DIR}:/workspace/app" \
  -v "${RESULTS_DIR}:/workspace/results" \
  -v "${CACHE_DIR}:/workspace/npm-cache" \
  -w /workspace/app \
  mcr.microsoft.com/playwright:v1.58.2-noble \
  bash -lc 'npm install --offline --legacy-peer-deps --no-audit --no-fund && ./node_modules/.bin/playwright test --config=playwright.config.ts'
