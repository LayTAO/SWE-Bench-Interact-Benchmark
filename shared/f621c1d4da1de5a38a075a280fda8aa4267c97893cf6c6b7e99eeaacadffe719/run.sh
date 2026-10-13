#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:?SUBJECT_DIR must identify the prepared subject}"
export BABEL_ENV=test
export STRICT_MODE=1

exec /opt/official-runtime/bin/node node_modules/jest/bin/jest.js src/components/select/filterable-select/filterable-select.spec.tsx src/components/select/multi-select/multi-select.spec.tsx --config=./jest.config.json --coverage=false --runInBand --json --outputFile="$RAW"
