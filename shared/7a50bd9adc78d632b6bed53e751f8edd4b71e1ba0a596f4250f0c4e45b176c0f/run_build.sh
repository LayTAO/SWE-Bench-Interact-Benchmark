#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
(cd "$SUBJECT_DIR" && bash -lc 'npm run build') >"$OUTPUT_DIR/build.log" 2>&1
