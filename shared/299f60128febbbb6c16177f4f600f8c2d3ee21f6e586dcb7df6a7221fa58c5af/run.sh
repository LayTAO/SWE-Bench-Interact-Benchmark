#!/usr/bin/env bash
set -euo pipefail
RESULT="${1:?result path is required}"
cd /subject/packages/webawesome
WTR_CONFIG=web-test-runner.chromium.config.js
[[ -f "$WTR_CONFIG" ]] || WTR_CONFIG=web-test-runner.config.js
cat >.harbor-wtr.config.mjs <<CONFIG
import base from './${WTR_CONFIG}';
import { defaultReporter } from '@web/test-runner';
import { interactRepairReporter } from '/tests/verifier/interactrepair-wtr-reporter.mjs';
export default { ...base, reporters: [defaultReporter(), interactRepairReporter()] };
CONFIG
trap 'rm -f .harbor-wtr.config.mjs' EXIT
INTERACT_RAW_RESULT="$RESULT" PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/ms-playwright}" CI=true FAIL_FAST=false ../../node_modules/.bin/web-test-runner --config .harbor-wtr.config.mjs --group tree --static-logging >"${RESULT}.console.log" 2>&1
