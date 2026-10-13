#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPRO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
: "${SUBJECT_DIR:?SUBJECT_DIR must point to a writable exact upstream checkout with dependencies installed}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
REPRO_VARIANT="${REPRO_VARIANT:-buggy}"
ENGINE="${CONTAINER_ENGINE:-$(command -v podman >/dev/null 2>&1 && echo podman || echo docker)}"
ORACLE_DIR="$OUTPUT_DIR/oracle"
TOOLING_DIR="$OUTPUT_DIR/tooling"
RESULTS_DIR="$OUTPUT_DIR/results"
mkdir -p "$ORACLE_DIR" "$TOOLING_DIR" "$RESULTS_DIR" "$OUTPUT_DIR/state-cache"
cp -R "$REPRO_ROOT/app/." "$ORACLE_DIR/"
cp "$REPRO_ROOT/tooling/package.json" "$REPRO_ROOT/tooling/capture.mjs" "$REPRO_ROOT/tooling/legacy-react.mjs" "$TOOLING_DIR/"
if [[ -n "${TOOLING_CACHE:-}" && -d "${TOOLING_CACHE}/node_modules" ]]; then cp -a "${TOOLING_CACHE}/node_modules" "$TOOLING_DIR/"; fi
MOUNTS=(-v "$SUBJECT_DIR:/subject:ro")
if [[ -L "$SUBJECT_DIR/node_modules" ]]; then
  NODE_MODULES_SOURCE="$(readlink -f "$SUBJECT_DIR/node_modules")"
  rm -f "$SUBJECT_DIR/node_modules"
  if [[ -d "$NODE_MODULES_SOURCE" ]]; then
    MOUNTS+=(-v "$NODE_MODULES_SOURCE:/subject/node_modules:ro")
  fi
fi
"$ENGINE" run --rm --ipc=host \
  -e INSTANCE_ID=IR-M-076 -e REPRO_VARIANT="$REPRO_VARIANT" \
  "${MOUNTS[@]}" -v "$ORACLE_DIR:/oracle" \
  -v "$TOOLING_DIR:/tooling" -v "$RESULTS_DIR:/results" \
  -v "$OUTPUT_DIR/state-cache:/state-cache" \
  -v "$SCRIPT_DIR/container.sh:/runner/container.sh:ro" \
  mcr.microsoft.com/playwright:v1.58.2-noble bash /runner/container.sh
