#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:-/workspace/repo}"

exec node node_modules/cypress/bin/cypress run --spec packages/react-integration/cypress/integration/truncate.spec.ts --reporter junit --reporter-options "mochaFile=${RAW%.json}.xml,toConsole=true"
