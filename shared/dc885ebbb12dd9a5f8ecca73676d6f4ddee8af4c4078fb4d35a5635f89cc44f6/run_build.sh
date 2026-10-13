#!/usr/bin/env bash
set -euo pipefail
export SUBJECT_DIR="${1:?subject directory}" OUTPUT_DIR="${2:?output directory}/source-build"
mkdir -p "$OUTPUT_DIR"
# Official Vitest imports the workspace config package's generated entrypoint.
# Its postinstall was disabled when dependencies were frozen.
(cd "$SUBJECT_DIR/config" && pnpm run build) >"$OUTPUT_DIR/config-build.log" 2>&1
bash /tests/canonical_repro/scripts/build.sh
