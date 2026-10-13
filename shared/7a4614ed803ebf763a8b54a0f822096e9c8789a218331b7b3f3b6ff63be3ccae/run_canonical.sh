#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?buggy or fixed}"
SUBJECT_DIR="${2:?prepared subject}"
OUTPUT_DIR="${3:?output directory}"
CANONICAL_ROOT=/tests/canonical_repro
mkdir -p "$OUTPUT_DIR"
export SUBJECT_DIR OUTPUT_DIR
export CONTAINER_ENGINE=/usr/local/bin/docker
CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -path '*/chrome-linux*/chrome' -print -quit 2>/dev/null || true)"
[[ -n "$CHROMIUM_EXECUTABLE" ]] || { echo 'No Playwright Chromium executable found' >&2; exit 2; }
export CHROME_BIN="$CHROMIUM_EXECUTABLE"
export TOOLING_CACHE_DIR="$CANONICAL_ROOT/tooling"
bash "$CANONICAL_ROOT/scripts/validate.sh" "$MODE" >"$OUTPUT_DIR/canonical.log" 2>&1
