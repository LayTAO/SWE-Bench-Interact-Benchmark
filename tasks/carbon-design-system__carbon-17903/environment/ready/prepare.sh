#!/usr/bin/env bash
set -euo pipefail
cd /workspace/repo
export CI=1 COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
yarn workspace typescript-config-carbon build
yarn workspace @carbon/icons build
if [[ -d packages/icon-helpers ]]; then yarn workspace @carbon/icon-helpers build; fi
yarn workspace @carbon/icons-react build
yarn workspaces foreach --recursive --topological --from @carbon/react --exclude @carbon/react run build
