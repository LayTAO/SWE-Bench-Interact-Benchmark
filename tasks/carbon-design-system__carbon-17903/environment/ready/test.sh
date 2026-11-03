#!/usr/bin/env bash
set -euo pipefail
cd /workspace/repo
export CI=1 COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
exec yarn test packages/react/src/components/ComposedModal/ComposedModal-test.js packages/react/src/components/Modal/Modal-test.js --runInBand "$@"
