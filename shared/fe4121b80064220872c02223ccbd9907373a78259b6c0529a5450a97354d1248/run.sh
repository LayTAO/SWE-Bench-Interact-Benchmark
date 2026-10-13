#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:-/workspace/repo}"

exec node node_modules/jest/bin/jest.js components/lib/inputnumber/InputNumber.spec.js --runInBand --json --outputFile="$RAW"
