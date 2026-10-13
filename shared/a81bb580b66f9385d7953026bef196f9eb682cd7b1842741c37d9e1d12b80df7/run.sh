#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
OUT="${RAW}.cypress-output"
SUBJECT_DIR="${INTERACT_SUBJECT_DIR:-/workspace/repo}"
cd "$SUBJECT_DIR/packages/react-components/react-tag-picker/library"
set +e
xvfb-run -a node "$SUBJECT_DIR/node_modules/cypress/bin/cypress" run --component --config-file cypress.config.ts --spec src/components/TagPicker/TagPicker.cy.tsx --browser electron --reporter json >"$OUT" 2>&1
status=$?
set -e
node /benchmark/harness/cypress-json-to-jest.cjs "$OUT" "$RAW"
exit "$status"
