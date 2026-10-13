#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
cd "$SUBJECT_DIR"
yarn workspace @shopify/polaris-tokens build
yarn workspace @shopify/polaris-icons build
yarn workspace @shopify/polaris build:js
