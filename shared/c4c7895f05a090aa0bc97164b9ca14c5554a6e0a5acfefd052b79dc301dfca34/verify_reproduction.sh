#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MODE="${1:-}"
case "${MODE}" in buggy|gold) ;; *) echo "usage: $0 buggy|gold" >&2; exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the exact prepared subject state}"
OUTPUT_DIR="${OUTPUT_DIR:-${SAMPLE_ROOT}/../../runs/unovue__reka-ui-2483/reproduction-${MODE}}"
PACKAGE_DIR="${OUTPUT_DIR}/package"

if command -v pnpm >/dev/null 2>&1; then
  SUBJECT_DIR="${SUBJECT_DIR}" OUTPUT_DIR="${PACKAGE_DIR}" bash "${SCRIPT_DIR}/build_subject_package.sh"
else
  if [[ -L "${SUBJECT_DIR}/node_modules" ]]; then rm -f "${SUBJECT_DIR}/node_modules"; fi
  mkdir -p "${PACKAGE_DIR}"
  ENGINE="${CONTAINER_ENGINE:-docker}"
  CACHE_ARGS=()
  if [[ -n "${INTERACTREPAIR_CACHE_ROOT:-}" && -d "${INTERACTREPAIR_CACHE_ROOT}" ]]; then
    CACHE_ARGS=(
      -v "${INTERACTREPAIR_CACHE_ROOT}/npm:/cache/npm:rw"
      -v "${INTERACTREPAIR_CACHE_ROOT}/pnpm:/cache/pnpm:rw"
      -v "${INTERACTREPAIR_CACHE_ROOT}/corepack:/cache/corepack:rw"
    )
  fi
  "${ENGINE}" run --rm --user 0 --ipc=host \
    -e CI=true -e npm_config_cache=/cache/npm -e COREPACK_HOME=/cache/corepack -e PNPM_HOME=/cache/pnpm \
    -v "${SUBJECT_DIR}:/subject:rw" -v "${PACKAGE_DIR}:/results:rw" \
    "${CACHE_ARGS[@]}" -w /subject mcr.microsoft.com/playwright:v1.58.2-noble \
    bash -lc 'corepack enable && pnpm install --frozen-lockfile --ignore-scripts && pnpm --filter reka-ui build-only && cd packages/core && mkdir -p /tmp/reka-pack && npm pack --ignore-scripts --pack-destination /tmp/reka-pack >/tmp/reka-pack.log 2>&1 && cp /tmp/reka-pack/reka-ui-*.tgz /results/'
fi
SUBJECT_PACKAGE="$(find "${PACKAGE_DIR}" -maxdepth 1 -name 'reka-ui-*.tgz' -print -quit)"
[[ -n "${SUBJECT_PACKAGE}" ]]
set +e
SUBJECT_PACKAGE="${SUBJECT_PACKAGE}" OUTPUT_DIR="${OUTPUT_DIR}" REPRO_VARIANT="${MODE}" \
  bash "${SAMPLE_ROOT}/public/repro/scripts/run.sh"
RUN_EXIT=$?
set -e

OBSERVATION="${OUTPUT_DIR}/results/observation.json"
if [[ "${MODE}" == "buggy" ]]; then
  [[ "${RUN_EXIT}" -ne 0 ]]
  /usr/bin/python3 -c 'import json,sys; assert json.load(open(sys.argv[1]))["oracle"]["passed"] is False' "${OBSERVATION}"
else
  [[ "${RUN_EXIT}" -eq 0 ]]
  /usr/bin/python3 -c 'import json,sys; assert json.load(open(sys.argv[1]))["oracle"]["passed"] is True' "${OBSERVATION}"
fi
