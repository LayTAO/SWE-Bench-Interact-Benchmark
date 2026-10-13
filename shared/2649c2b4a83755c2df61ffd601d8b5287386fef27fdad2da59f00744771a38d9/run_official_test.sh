#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?set SUBJECT_DIR to the exact Buggy or Fixed checkout}"
: "${OUTPUT_FILE:?set OUTPUT_FILE to an isolated JSON result path}"
cd "$SUBJECT_DIR"
cd packages/react
exec pnpm exec vitest run --config vite.config.mts test/unit/FloatingFocusManager.test.tsx --reporter=json --outputFile="$OUTPUT_FILE"
