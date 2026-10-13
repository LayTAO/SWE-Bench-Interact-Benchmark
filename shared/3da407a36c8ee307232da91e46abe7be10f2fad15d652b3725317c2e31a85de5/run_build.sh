#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
printf '%s\n' 'No explicit accepted build_command; build gate is not applicable.' >"$OUTPUT_DIR/build.log"
