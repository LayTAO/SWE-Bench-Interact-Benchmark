#!/usr/bin/env bash
set -euo pipefail

: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
OUTPUT_DIR="${OUTPUT_DIR:-$(pwd)/runs/ariakit__ariakit-4825/reproduction}"
VARIANT="${REPRO_VARIANT:-buggy}"
mkdir -p "$OUTPUT_DIR"

cd "$SUBJECT_DIR"
pnpm --filter site build-min
cd site

export PLAYWRIGHT_JSON_OUTPUT_NAME="$OUTPUT_DIR/${VARIANT}.playwright.json"
pnpm test-chrome src/sandbox/4825-dialog-combobox/test-browser.ts \
  --workers=1 \
  --retries=0 \
  --reporter=json \
  --trace=on \
  --output="$OUTPUT_DIR/artifacts"
