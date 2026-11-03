#!/usr/bin/env bash
set -euo pipefail
cd /workspace/repo
export CI=1 COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
exec yarn jest polaris-react/src/components/Popover/components/PopoverOverlay/tests/PopoverOverlay.test.tsx --runInBand "$@"
