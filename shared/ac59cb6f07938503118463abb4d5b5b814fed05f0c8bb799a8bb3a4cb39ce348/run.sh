#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:-/workspace/repo}"
export ARIAKIT_TEST_LOADER=react
export BABEL_ENV=test
export STRICT_MODE=1

exec node node_modules/jest/bin/jest.js packages/ariakit/src/combobox/__examples__/combobox-cancel/test.tsx --runInBand --json --outputFile="$RAW"
