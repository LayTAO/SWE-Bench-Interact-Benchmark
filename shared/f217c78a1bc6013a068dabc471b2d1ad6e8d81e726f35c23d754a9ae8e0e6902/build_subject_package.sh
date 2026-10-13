#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
case "${MODE}" in
  buggy|gold) ;;
  *) echo "usage: $0 buggy|gold" >&2; exit 2 ;;
esac

: "${SUBJECT_DIR:?SUBJECT_DIR must point to the exact prepared subject state}"
cd "${SUBJECT_DIR}"

# The canonical reproduction imports the exact TypeScript entrypoints through
# Vite, so a prebuilt dist tree is not required for this oracle. Use the
# upstream build when its output is already available; otherwise let the
# containerized Vite runner compile the source files.
if [[ -f "packages/components/select/register.js" ]]; then
  node .yarn/releases/yarn-4.13.0.cjs node scripts/build-packages.js components
else
  echo "canonical reproduction: using Vite TypeScript source mode"
fi
