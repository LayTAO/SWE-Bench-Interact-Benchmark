#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
(cd "$SUBJECT_DIR" && bash -lc 'node .yarn/releases/yarn-4.10.3.cjs workspace typescript-config-carbon build && node .yarn/releases/yarn-4.10.3.cjs workspaces foreach --recursive --topological --from @carbon/web-components run build') >"$OUTPUT_DIR/build.log" 2>&1
