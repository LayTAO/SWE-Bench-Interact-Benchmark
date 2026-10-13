#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
(cd "$SUBJECT_DIR" && bash -lc 'node .yarn/releases/yarn-4.10.3.cjs workspace typescript-config-carbon build && node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons build && if [[ -d packages/icon-helpers ]]; then node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icon-helpers build; fi && node .yarn/releases/yarn-4.10.3.cjs workspace @carbon/icons-react build && node .yarn/releases/yarn-4.10.3.cjs workspaces foreach --recursive --topological --from @carbon/react --exclude @carbon/react run build') >"$OUTPUT_DIR/build.log" 2>&1
