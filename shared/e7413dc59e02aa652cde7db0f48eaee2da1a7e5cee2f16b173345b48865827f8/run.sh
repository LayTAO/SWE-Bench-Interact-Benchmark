#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPRO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the exact subject checkout}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
: "${REPRO_VARIANT:?REPRO_VARIANT is required}"
: "${EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK:?expected open-state flag is required}"

ENGINE="${CONTAINER_ENGINE:-$(command -v docker >/dev/null 2>&1 && echo docker || echo docker)}"
ORACLE_DIR="${OUTPUT_DIR}/oracle"
TOOLING_DIR="${OUTPUT_DIR}/tooling"
RESULTS_DIR="${OUTPUT_DIR}/results"
mkdir -p "${ORACLE_DIR}" "${TOOLING_DIR}" "${RESULTS_DIR}"
cp -R "${REPRO_ROOT}/app/." "${ORACLE_DIR}/"
cp "${REPRO_ROOT}/tooling/package.json" "${TOOLING_DIR}/"
cp "${REPRO_ROOT}/app/run.cjs" "${ORACLE_DIR}/run.cjs"
if [[ -n "${TOOLING_CACHE:-}" && -d "${TOOLING_CACHE}/node_modules" ]]; then
  cp -a "${TOOLING_CACHE}/node_modules" "${TOOLING_DIR}/"
fi
MOUNTS=(-v "${SUBJECT_DIR}:/subject:ro")
if [[ -L "${SUBJECT_DIR}/node_modules" ]]; then
  NODE_MODULES_SOURCE="$(readlink -f "${SUBJECT_DIR}/node_modules")"
  rm -f "${SUBJECT_DIR}/node_modules"
  if [[ -d "${NODE_MODULES_SOURCE}" ]]; then
    MOUNTS+=(-v "${NODE_MODULES_SOURCE}:/subject/node_modules:ro")
  fi
fi

"${ENGINE}" run --rm --ipc=host \
  -e REPRO_VARIANT="${REPRO_VARIANT}" \
  -e EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK="${EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK}" \
  "${MOUNTS[@]}" \
  -v "${ORACLE_DIR}:/oracle" \
  -v "${TOOLING_DIR}:/tooling" \
  -v "${RESULTS_DIR}:/results" \
  -v "${SCRIPT_DIR}/container.sh:/runner/container.sh:ro" \
  mcr.microsoft.com/playwright:v1.58.2-noble bash /runner/container.sh
