#!/usr/bin/env bash
set -euo pipefail
MODE="${1:-}"
case "${MODE}" in buggy|gold) ;; *) echo "usage: $0 buggy|gold" >&2; exit 2 ;; esac
echo "Use the exact ${MODE} source state directly; the frozen app aliases Dialog and DropdownMenu from that checkout."
