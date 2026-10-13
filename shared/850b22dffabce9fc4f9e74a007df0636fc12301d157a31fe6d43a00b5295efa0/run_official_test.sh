#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?set SUBJECT_DIR to the exact Buggy or Fixed checkout}"
: "${OUTPUT_FILE:?set OUTPUT_FILE to an isolated JSON result path}"
cd "$SUBJECT_DIR"
cp /tests/verifier/base_ui_vitest.config.mts "$SUBJECT_DIR/.harbor-vitest.config.mts"
exec pnpm exec vitest run --config .harbor-vitest.config.mts packages/react/src/checkbox/root/CheckboxRoot.test.tsx packages/react/src/radio/root/RadioRoot.test.tsx packages/react/src/switch/root/SwitchRoot.test.tsx --reporter=json --outputFile="$OUTPUT_FILE" --browser chromium
