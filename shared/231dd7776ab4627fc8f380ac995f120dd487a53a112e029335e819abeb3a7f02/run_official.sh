#!/usr/bin/env bash
set -euo pipefail

cd /workspace/subject/packages/vuetify
export INTERACT_CHROME_PATH=/ms-playwright/chromium-1208/chrome-linux64/chrome
node /tests/verifier/patch-vuetify.cjs
node /workspace/subject/node_modules/vitest/vitest.mjs \
  --project browser \
  src/components/VAutocomplete/__tests__/VAutocomplete.spec.browser.tsx \
  src/components/VCombobox/__tests__/VCombobox.spec.browser.tsx \
  src/components/VSelect/__tests__/VSelect.spec.browser.tsx \
  --run --reporter=json --outputFile=/logs/verifier/official.raw.json
