#!/usr/bin/env bash
set -euo pipefail

: "${SUBJECT_DIR:?SUBJECT_DIR must point to an exact checkout with dependencies installed}"
cd "$SUBJECT_DIR"
pnpm --filter site build-min
printf '%s\n' "$SUBJECT_DIR/site/dist"
