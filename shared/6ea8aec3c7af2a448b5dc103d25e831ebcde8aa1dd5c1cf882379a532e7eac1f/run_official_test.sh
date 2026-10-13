#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?set SUBJECT_DIR to the exact Buggy or Fixed checkout}"
: "${OUTPUT_FILE:?set OUTPUT_FILE to an isolated JSON result path}"
cd "$SUBJECT_DIR"
exec pnpm exec vitest run --config vite.config.ts src/tests/dialog/Dialog.spec.ts src/tests/popover/Popover.spec.ts --reporter=json --outputFile="$OUTPUT_FILE"
