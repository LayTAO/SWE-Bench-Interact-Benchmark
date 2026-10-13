#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:-/workspace/repo}"
export NODE_ENV=test
export INTERACT_MOCHA_RESULT="$RAW"

exec node node_modules/mocha/bin/mocha packages/material-ui/src/Modal/Modal.test.js packages/material-ui/src/Portal/Portal.test.js --reporter /benchmark/harness/mocha-reporter.cjs --exit
