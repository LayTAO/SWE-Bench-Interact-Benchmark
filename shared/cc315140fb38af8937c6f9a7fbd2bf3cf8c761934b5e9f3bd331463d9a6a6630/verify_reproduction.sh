#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MODE="${1:-}"
case "${MODE}" in
  buggy) EXPECTED_STATE='dialog: closed | menu: closed' ;;
  gold) EXPECTED_STATE='dialog: open | menu: closed' ;;
  *) echo "usage: $0 buggy|gold" >&2; exit 2 ;;
esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the exact subject state}"
SUBJECT_DIR="${SUBJECT_DIR}" EXPECTED_STATE="${EXPECTED_STATE}" \
  OUTPUT_DIR="${OUTPUT_DIR:-${SAMPLE_ROOT}/../../runs/radix-ui__primitives-3971/reproduction-${MODE}}" \
  bash "${SAMPLE_ROOT}/public/repro/scripts/run.sh"
