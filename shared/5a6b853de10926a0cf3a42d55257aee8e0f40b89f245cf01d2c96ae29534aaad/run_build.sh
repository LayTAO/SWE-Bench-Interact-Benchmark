#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
mkdir -p "$OUTPUT_DIR"
export COREPACK_HOME="${COREPACK_HOME:-/corepack}"
if node -e 'const p=require(process.argv[1]); process.exit(p.scripts && p.scripts.build ? 0 : 1)' "$SUBJECT_DIR/package.json" 2>/dev/null; then
  # Mantine's build script writes generated CSS metadata under this ignored
  # directory; create it in the clean Harbor subject before invoking the build.
  mkdir -p "$SUBJECT_DIR/apps/mantine.dev/src/.docgen"
  case "${HARBOR_PACKAGE_MANAGER:-npm}" in
    pnpm) (cd "$SUBJECT_DIR" && pnpm run build) ;;
    yarn) (cd "$SUBJECT_DIR" && yarn build) ;;
    *) (cd "$SUBJECT_DIR" && npm run build) ;;
  esac >"$OUTPUT_DIR/build.log" 2>&1
else
  printf '%s\n' 'No package build script declared; build gate is not applicable.' >"$OUTPUT_DIR/build.log"
fi
