#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:?SUBJECT_DIR must identify the prepared subject}"

exec /opt/official-runtime/bin/node node_modules/vitest/vitest.mjs packages/mui-material/src/Select/Select.test.js --run --reporter=json --outputFile="$RAW"
