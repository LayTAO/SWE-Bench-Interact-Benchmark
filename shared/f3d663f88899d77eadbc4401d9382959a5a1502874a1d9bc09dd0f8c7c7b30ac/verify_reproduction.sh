#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MODE="${1:-}"
case "${MODE}" in
  buggy) EXPECTED_REOPEN_CHANGE=true ;;
  gold) EXPECTED_REOPEN_CHANGE=false ;;
  *) echo "usage: $0 buggy|gold" >&2; exit 2 ;;
esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the built exact subject state}"
OUTPUT_DIR="${OUTPUT_DIR:-${SAMPLE_ROOT}/../../runs/ni__nimble-2022/reproduction-${MODE}}"
mkdir -p "${OUTPUT_DIR}"
SUBJECT_DIR="${SUBJECT_DIR}" OUTPUT_DIR="${OUTPUT_DIR}" \
  EXPECTED_REOPEN_CHANGE="${EXPECTED_REOPEN_CHANGE}" \
  bash "${SAMPLE_ROOT}/public/repro/scripts/run.sh"
