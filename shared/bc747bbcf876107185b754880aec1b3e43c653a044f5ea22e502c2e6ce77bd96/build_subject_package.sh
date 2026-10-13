#!/usr/bin/env bash
set -euo pipefail

: "${SUBJECT_DIR:?SUBJECT_DIR must point to the exact prepared subject state}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
mkdir -p "${OUTPUT_DIR}"
cd "${SUBJECT_DIR}"
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter reka-ui build-only
cd packages/core
npm pack --ignore-scripts --pack-destination "${OUTPUT_DIR}"
