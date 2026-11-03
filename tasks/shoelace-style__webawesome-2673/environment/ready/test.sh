#!/usr/bin/env bash
set -euo pipefail
cd /workspace/repo
export CI=1 COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
exec npm exec --workspace @awesome.me/webawesome -- web-test-runner --config /opt/swe-bench-ready/tree.wtr.config.mjs --group tree --static-logging "$@"
