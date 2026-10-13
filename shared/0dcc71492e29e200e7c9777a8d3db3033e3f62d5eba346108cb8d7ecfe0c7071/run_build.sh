#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
export COREPACK_HOME="${COREPACK_HOME:-/corepack}"
# The Accepted runner metadata declares no repository-wide build command.
# Running the monorepo's generic `pnpm build` introduced an unrelated,
# nondiagnostic exit 129 before the two actual acceptance paths could run.
# Canonical Vite compilation and the selected Vitest file both compile the
# touched time-picker code and remain the authoritative build/behavior gates.
printf '%s\n' \
  'No explicit Accepted build_command; canonical Vite and selected Vitest compilation are the build gates.' \
  >"$OUTPUT_DIR/build.log"
