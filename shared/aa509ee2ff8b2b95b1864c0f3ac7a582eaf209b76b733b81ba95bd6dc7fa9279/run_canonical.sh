#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?buggy or fixed}"
SUBJECT_DIR="${2:?prepared subject}"
OUTPUT_DIR="${3:?output directory}"
CANONICAL_ROOT=/tests/canonical_repro
mkdir -p "$OUTPUT_DIR"
export SUBJECT_DIR OUTPUT_DIR
export CONTAINER_ENGINE=/usr/local/bin/docker
export CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
export CHROME_BIN="$CHROMIUM_EXECUTABLE"
export TOOLING_CACHE_DIR="$CANONICAL_ROOT/tooling"
export STATE_CACHE_DIR="$OUTPUT_DIR/state-cache"
export TOOLING_CACHE_ROOT="$STATE_CACHE_DIR/tooling-cache"
tooling_hash="$(sha256sum "$CANONICAL_ROOT/tooling/package.json" "$CANONICAL_ROOT/tooling/package-lock.json" "$CANONICAL_ROOT/tooling/legacy-react.mjs" | sha256sum | cut -d' ' -f1)"
tooling_dir="$TOOLING_CACHE_ROOT/tooling-$tooling_hash"
mkdir -p "$tooling_dir"
cp "$CANONICAL_ROOT/tooling/package.json" "$CANONICAL_ROOT/tooling/package-lock.json" "$CANONICAL_ROOT/tooling/legacy-react.mjs" "$tooling_dir/"
test -d "$CANONICAL_ROOT/tooling/node_modules/playwright"
ln -s "$CANONICAL_ROOT/tooling/node_modules" "$tooling_dir/node_modules"
touch "$tooling_dir/.interactrepair-ready"
bash "$CANONICAL_ROOT/scripts/validate.sh" "$MODE" >"$OUTPUT_DIR/canonical.log" 2>&1
