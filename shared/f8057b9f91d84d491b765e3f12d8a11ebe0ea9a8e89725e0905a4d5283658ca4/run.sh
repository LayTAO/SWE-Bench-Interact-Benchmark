#!/usr/bin/env bash
set -uo pipefail
RAW="${1:-${INTERACT_RAW_RESULT:?missing raw result path}}"
cd "${SUBJECT_DIR:?SUBJECT_DIR must identify the prepared subject}"
export BABEL_ENV=test
export STRICT_MODE=1

exec node node_modules/jest/bin/jest.js packages/@headlessui-react/src/components/listbox/listbox.test.tsx packages/@headlessui-react/src/components/menu/menu.test.tsx --runInBand --json --outputFile="$RAW"
