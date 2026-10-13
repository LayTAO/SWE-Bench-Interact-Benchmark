#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:?SUBJECT_DIR must identify the prepared subject}/packages/core"

exec node node_modules/vitest/vitest.mjs src/DatePicker/DatePicker.test.ts --run --reporter=json --outputFile="$RAW"
