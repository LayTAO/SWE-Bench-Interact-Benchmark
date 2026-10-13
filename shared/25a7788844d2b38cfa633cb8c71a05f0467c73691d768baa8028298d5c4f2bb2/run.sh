#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:-/workspace/repo}"
export BABEL_ENV=test
export STRICT_MODE=1

exec node node_modules/jest/bin/jest.js --runTestsByPath packages/@react-aria/utils/test/runAfterTransition.test.ts --runInBand --json --outputFile="$RAW"
