#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${INTERACT_SUBJECT_DIR:-/workspace/repo}"
export ARIAKIT_TEST_LOADER=react

exec node node_modules/vitest/vitest.mjs app/src/sandbox/dialog-6344/test.ts packages/ariakit-react-components/src/dialog/utils/orchestrate.test.ts --run --reporter=json --outputFile="$RAW"
