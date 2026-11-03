#!/usr/bin/env bash
set -euo pipefail
cd /workspace/repo
export CI=1 COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
exec yarn test --runInBand --runTestsByPath packages/react-core/src/components/Truncate/__tests__/Truncate.test.tsx "$@"
