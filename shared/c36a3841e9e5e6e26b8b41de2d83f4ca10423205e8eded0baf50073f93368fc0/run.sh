#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:-/workspace/repo}"

exec node node_modules/vitest/vitest.mjs packages/react/dropdown-menu/src/dropdown-menu.test.tsx packages/react/select/src/select.test.tsx packages/react/tabs/src/tabs.test.tsx packages/react/toolbar/src/toolbar.test.tsx --run --reporter=json --outputFile="$RAW"
