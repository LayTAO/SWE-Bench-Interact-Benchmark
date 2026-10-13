#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?set SUBJECT_DIR to the exact Buggy or Fixed checkout}"
: "${OUTPUT_FILE:?set OUTPUT_FILE to an isolated JSON result path}"
cd "$SUBJECT_DIR"
exec pnpm exec vitest run --config vitest.config.mts packages/components/date-picker-panel/__tests__/date-picker-panel.test.tsx --reporter=json --outputFile="$OUTPUT_FILE"
