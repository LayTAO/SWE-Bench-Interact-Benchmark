#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MODE="${1:-}"

case "${MODE}" in
  buggy) EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK=false ;;
  gold) EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK=true ;;
  *) echo "usage: $0 buggy|gold" >&2; exit 2 ;;
esac

: "${SUBJECT_DIR:?SUBJECT_DIR must point to the exact prepared subject state}"
OUTPUT_DIR="${OUTPUT_DIR:-${SAMPLE_ROOT}/../../runs/sl-design-system__components-3150/reproduction-${MODE}}"

SUBJECT_DIR="${SUBJECT_DIR}" bash "${SCRIPT_DIR}/build_subject_package.sh" "${MODE}"
mkdir -p "${OUTPUT_DIR}"
SUBJECT_DIR="${SUBJECT_DIR}" \
OUTPUT_DIR="${OUTPUT_DIR}" \
REPRO_VARIANT="${MODE}" \
EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK="${EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK}" \
  bash "${SAMPLE_ROOT}/public/repro/scripts/run.sh"
