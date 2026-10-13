#!/usr/bin/env bash
set -euo pipefail
REQUESTED_MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$REQUESTED_MODE" in
  buggy|fixed) MODE="$REQUESTED_MODE" ;;
  patched) MODE=fixed ;;
  *) exit 2 ;;
esac
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"; : "${OUTPUT_DIR:?OUTPUT_DIR is required}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="${CONTAINER_ENGINE:-/usr/local/bin/docker}"; IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.58.2-noble}"
mkdir -p "$OUTPUT_DIR/tooling" "$OUTPUT_DIR/results" "$OUTPUT_DIR/state-cache"
TOOLING_DIR="${TOOLING_CACHE_DIR:-$OUTPUT_DIR/tooling}"
mkdir -p "$TOOLING_DIR"
if [[ ! -d "$TOOLING_DIR/node_modules/playwright" ]]; then
  "$ENGINE" run --rm -v "$TOOLING_DIR:/tooling" "$IMAGE" bash -lc 'cd /tooling && npm install --no-audit --no-fund --prefer-offline'
fi
"$ENGINE" run --rm --ipc=host -e REPRO_VARIANT="$MODE" -v "$SUBJECT_DIR:/subject:ro" -v "$ROOT/app:/oracle-src:ro" -v "$TOOLING_DIR:/tooling:ro" -v "$OUTPUT_DIR:/results" -v "$ROOT/scripts/container.sh:/runner/container.sh:ro" -v "$OUTPUT_DIR/state-cache:/state-cache" "$IMAGE" bash /runner/container.sh
