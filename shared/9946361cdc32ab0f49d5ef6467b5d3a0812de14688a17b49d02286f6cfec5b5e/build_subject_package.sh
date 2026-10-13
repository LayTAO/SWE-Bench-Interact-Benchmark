#!/usr/bin/env bash
set -euo pipefail
MODE="${1:-}"
case "${MODE}" in
  buggy|gold) ;;
  *) echo "usage: $0 buggy|gold" >&2; exit 2 ;;
esac
echo "Build packages/nimble-components from the exact ${MODE} source state using the environment Dockerfile."
