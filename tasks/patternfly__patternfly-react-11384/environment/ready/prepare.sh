#!/usr/bin/env bash
set -euo pipefail
cd /workspace/repo
export CI=1 COREPACK_ENABLE_NETWORK=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
yarn --version
# Workspace scripts use root-provided build tools such as rimraf.
export PATH=/workspace/repo/node_modules/.bin:$PATH
for package in react-styles react-tokens react-icons react-core; do
  yarn workspace "@patternfly/$package" generate
done
yarn exec tsc --build packages/react-styles/tsconfig.json packages/react-styles/tsconfig.cjs.json packages/react-icons/tsconfig.json packages/react-icons/tsconfig.cjs.json
