#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
(cd "$SUBJECT_DIR" && bash -lc 'corepack yarn workspace typescript-config-carbon build && corepack yarn workspace @carbon/icons build && if [[ -d packages/icon-helpers ]]; then corepack yarn workspace @carbon/icon-helpers build; fi && corepack yarn workspace @carbon/icons-react build && corepack yarn workspaces foreach --recursive --topological --from @carbon/react --exclude @carbon/react run build') >"$OUTPUT_DIR/build.log" 2>&1
