#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd /workspace/repo

exec node node_modules/vitest/vitest.mjs packages/components/time-picker/__tests__/time-picker.test.tsx --run --reporter=json --outputFile="$RAW"
