#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:?SUBJECT_DIR must identify the prepared subject}/packages/vuetify"
export BABEL_ENV=test
export STRICT_MODE=1

# The verifier image contains a preinstalled workspace and may carry Jest's
# transform cache from image construction.  The official patch adds a test to
# this file, so force discovery from the prepared subject instead of accepting
# a stale cached 20-test suite.
exec node "${SUBJECT_DIR:?SUBJECT_DIR must identify the prepared subject}/node_modules/jest/bin/jest.js" src/components/VAutocomplete/__tests__/VAutocomplete.spec.ts --runInBand --no-cache --json --outputFile="$RAW"
