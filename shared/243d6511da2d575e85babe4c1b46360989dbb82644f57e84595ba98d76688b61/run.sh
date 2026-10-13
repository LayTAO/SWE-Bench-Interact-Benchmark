#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd /workspace/repo
export ARIAKIT_TEST_LOADER=react

exec node node_modules/vitest/vitest.mjs app/src/sandbox/tab-select-6346/test.ts packages/ariakit-components/src/tab/tab-store.test.ts examples/tab/test.ts --run --reporter=json --outputFile="$RAW"
