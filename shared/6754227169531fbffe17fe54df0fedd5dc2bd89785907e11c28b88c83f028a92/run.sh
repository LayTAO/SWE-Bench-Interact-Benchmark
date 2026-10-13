#!/usr/bin/env bash
set -euo pipefail
SOURCE_APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/../app" && pwd)"
SOURCE_TOOLING="$(cd "$(dirname "${BASH_SOURCE[0]}")/../tooling" && pwd)"
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
: "${EXPECTED_REOPEN_CHANGE:?EXPECTED_REOPEN_CHANGE is required}"
RUNTIME_APP="${RUNTIME_APP:-${OUTPUT_DIR}/app}"
TOOLING_DIR="${OUTPUT_DIR}/tooling"
mkdir -p "${OUTPUT_DIR}" "${RUNTIME_APP}" "${TOOLING_DIR}"
cp -R "${SOURCE_APP}/." "${RUNTIME_APP}/"
if [[ -d "${SOURCE_TOOLING}/node_modules/playwright" && ! -d "${TOOLING_DIR}/node_modules/playwright" ]]; then
  cp -R "${SOURCE_TOOLING}/." "${TOOLING_DIR}/"
fi
MOUNTS=(-v "$SUBJECT_DIR:/subject:rw")
if [[ -L "$SUBJECT_DIR/node_modules" ]]; then
  NODE_MODULES_SOURCE="$(readlink -f "$SUBJECT_DIR/node_modules")"
  rm -f "$SUBJECT_DIR/node_modules"
  if [[ -d "$NODE_MODULES_SOURCE" ]]; then
    MOUNTS+=(-v "$NODE_MODULES_SOURCE:/subject/node_modules:ro")
  fi
fi
ENGINE="${CONTAINER_ENGINE:-/usr/local/bin/docker}"
[[ -x "$ENGINE" ]] || { echo "container engine is unavailable: $ENGINE" >&2; exit 2; }
"$ENGINE" run --rm --ipc=host \
  -e SUBJECT_DIR=/subject -e OUTPUT_DIR=/results \
  -e EXPECTED_REOPEN_CHANGE="$EXPECTED_REOPEN_CHANGE" \
  -e CHROME_BIN=/ms-playwright/chromium-1208/chrome-linux64/chrome \
  "${MOUNTS[@]}" -v "$RUNTIME_APP:/app:rw" -v "$OUTPUT_DIR:/results:rw" -v "$TOOLING_DIR:/tooling:rw" \
  -v "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/container.sh:/runner/container.sh:ro" \
  mcr.microsoft.com/playwright:v1.58.2-noble bash /runner/container.sh
