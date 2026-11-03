#!/usr/bin/env bash
set -euo pipefail
cd /workspace/repo
export CI=1 COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
exec node /opt/swe-bench-ready/offline-a11y.cjs yarn test packages/react/src/components/MultiSelect/__tests__/MultiSelect-test.js --runInBand "$@"
