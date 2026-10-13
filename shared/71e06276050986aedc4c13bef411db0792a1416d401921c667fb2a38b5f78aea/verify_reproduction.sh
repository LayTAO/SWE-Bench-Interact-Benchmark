#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="${REPO_ROOT:?REPO_ROOT must point to the isolated build root}"
INSTANCE_ID="adobe__react-spectrum-9748"
PUBLIC_REPRO="${SAMPLE_ROOT}/public/repro"
MODE="${1:-}"

case "${MODE}" in
  buggy) EXPECT_COMMITTED=false; EXPECT_POPOVER_CLOSED=true ;;
  gold) EXPECT_COMMITTED=true; EXPECT_POPOVER_CLOSED=true ;;
  *) echo "Usage: bash ${0} [buggy|gold]" >&2; exit 2 ;;
esac

RUN_ROOT="${RUN_ROOT:-${REPO_ROOT}/runs/${INSTANCE_ID}/construction-reproduction-${MODE}}"
EVIDENCE_DIR="${RUN_ROOT}/evidence"
RUNTIME_APP="${RUNTIME_APP:-${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-reproduction-${MODE}/app}"
BUILD_LOG="${RUN_ROOT}/build.log"
ARTIFACT_JSON="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-${MODE}/artifacts/artifact.json"
RESULT_FILE="${SAMPLE_ROOT}/construction/results/reproduction/${MODE}.json"
mkdir -p "${EVIDENCE_DIR}" "$(dirname "${RESULT_FILE}")"

if [[ "${REUSE_SUBJECT_ARTIFACT:-0}" != "1" || ! -s "${ARTIFACT_JSON}" ]]; then
  bash "${SCRIPT_DIR}/build_subject_package.sh" "${MODE}" >"${BUILD_LOG}"
else
  printf 'Reusing %s\n' "${ARTIFACT_JSON}" >"${BUILD_LOG}"
fi

ARTIFACT_SHA256="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["sha256"]["combined"])' "${ARTIFACT_JSON}")"
ARTIFACT_PATH="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["pack_paths"]["@react-aria/overlays"])' "${ARTIFACT_JSON}")"
[[ -s "${ARTIFACT_PATH}" ]] || { echo "candidate overlay artifact is missing: ${ARTIFACT_PATH}" >&2; exit 1; }
RUNTIME_APP="${RUNTIME_APP}" PUBLIC_REPRO="${PUBLIC_REPRO}" ARTIFACT_JSON="${ARTIFACT_JSON}" python3 - <<'PY'
import json
import os
import shutil
from pathlib import Path

runtime = Path(os.environ['RUNTIME_APP'])
public = Path(os.environ['PUBLIC_REPRO'])
artifact = json.loads(Path(os.environ['ARTIFACT_JSON']).read_text())
if runtime.exists():
    shutil.rmtree(runtime)
(runtime / 'vendor').mkdir(parents=True)
for source in public.joinpath('app').iterdir():
    if source.name in {'node_modules', 'test-results', 'playwright-report', 'package-lock.json'}:
        continue
    target = runtime / source.name
    if source.is_dir():
        shutil.copytree(source, target)
    else:
        shutil.copy2(source, target)
deps = {}
package_json = runtime / 'package.json'
data = json.loads(package_json.read_text())
# The browser run is served from the exact monorepo checkout inside the image.
# Keep this app dependency manifest for provenance, but do not install its
# published packages: Parcel must resolve workspace source so the Buggy/Gold
# production patch is the only variant difference.
package_json.write_text(json.dumps(data, indent=2) + '\n')
PY

cd "${RUNTIME_APP}"
if [[ -n "${SUBJECT_DIR_OVERRIDE:-}" ]]; then
  REPRO_ROOT="/workspace/repo/.ir-m-008-repro"
  rm -rf "${REPRO_ROOT}"
  mkdir -p "${REPRO_ROOT}"
  cp -R "${RUNTIME_APP}/." "${REPRO_ROOT}/"
  # The Spectrum workspace packages are resolved from the monorepo's
  # /workspace/repo/node_modules tree, not from the copied app directory.
  # Replace that exact package entry so the browser executes this candidate
  # artifact rather than the preinstalled workspace symlink.
  PACKAGE_ROOT="/workspace/repo/packages/@react-aria/overlays"
  PACKAGE_BACKUP="${PACKAGE_ROOT}.original.$$"
  if [[ -e "${PACKAGE_ROOT}" || -L "${PACKAGE_ROOT}" ]]; then
    mv "${PACKAGE_ROOT}" "${PACKAGE_BACKUP}"
  fi
  restore_package() {
    rm -rf "${PACKAGE_ROOT}"
    if [[ -e "${PACKAGE_BACKUP}" || -L "${PACKAGE_BACKUP}" ]]; then
      mv "${PACKAGE_BACKUP}" "${PACKAGE_ROOT}"
    fi
  }
  trap restore_package EXIT
  mkdir -p "${PACKAGE_ROOT}"
  tar -xzf "${ARTIFACT_PATH}" --strip-components=1 -C "${PACKAGE_ROOT}"
  cd "${REPRO_ROOT}"
  export REPRO_EVIDENCE_DIR="${EVIDENCE_DIR}"
  export REPRO_VARIANT="${MODE}"
  export SUBJECT_ARTIFACT_SHA256="${ARTIFACT_SHA256}"
  node /workspace/repo/node_modules/playwright/cli.js test
  restore_package
  trap - EXIT
else
  if [[ -n "${CONTAINER_ENGINE:-}" ]]; then
    ENGINE="${CONTAINER_ENGINE}"
  elif command -v podman >/dev/null 2>&1; then
    ENGINE="podman"
  elif command -v docker >/dev/null 2>&1; then
    ENGINE="docker"
  else
    echo "Docker or Podman is required" >&2
    exit 2
  fi

  "${ENGINE}" run --rm --user 0 --entrypoint /usr/bin/bash \
    -v "${RUNTIME_APP}:/workspace/repo/.ir-m-008-repro" \
    -v "${ARTIFACT_PATH}:/subject-artifact:ro" \
    -v "${EVIDENCE_DIR}:/evidence" \
    -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    -e REPRO_EVIDENCE_DIR=/evidence \
    -e REPRO_VARIANT="${MODE}" \
    -e SUBJECT_ARTIFACT_SHA256="${ARTIFACT_SHA256}" \
    -e SUBJECT_ARTIFACT_PATH=/subject-artifact \
    "${IMAGE_NAME:-interactrepair-ir-m-008}" \
    -lc 'set -euo pipefail; cd /workspace/repo; git reset --hard; git clean -fd -e .ir-m-008-repro/; git checkout 80ef0d833d85f3897cfbab2b00291bf85f42e46a; if [[ "${REPRO_VARIANT}" == "gold" ]]; then git apply --check /tmp/gold.patch; git apply /tmp/gold.patch; fi; PACKAGE_ROOT=/workspace/repo/packages/@react-aria/overlays; PACKAGE_BACKUP="${PACKAGE_ROOT}.original.$$"; if [[ -e "${PACKAGE_ROOT}" || -L "${PACKAGE_ROOT}" ]]; then mv "${PACKAGE_ROOT}" "${PACKAGE_BACKUP}"; fi; restore_package() { rm -rf "${PACKAGE_ROOT}"; if [[ -e "${PACKAGE_BACKUP}" || -L "${PACKAGE_BACKUP}" ]]; then mv "${PACKAGE_BACKUP}" "${PACKAGE_ROOT}"; fi; }; trap restore_package EXIT; mkdir -p "${PACKAGE_ROOT}"; tar -xzf "${SUBJECT_ARTIFACT_PATH}" --strip-components=1 -C "${PACKAGE_ROOT}"; cd .ir-m-008-repro; node /workspace/repo/node_modules/playwright/cli.js test; restore_package; trap - EXIT'
fi

RESULT_DIR="$(find "${RUNTIME_APP}/test-results" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | head -1 || true)"
if [[ -n "${RESULT_DIR}" ]]; then
  [[ -f "${RESULT_DIR}/video.webm" ]] && cp "${RESULT_DIR}/video.webm" "${EVIDENCE_DIR}/${MODE}-video.webm"
  [[ -f "${RESULT_DIR}/trace.zip" ]] && cp "${RESULT_DIR}/trace.zip" "${EVIDENCE_DIR}/${MODE}-trace.zip"
fi

python3 - "${EVIDENCE_DIR}/observation.json" "${RUN_ROOT}/verification.json" "${RESULT_FILE}" "${MODE}" "${EXPECT_COMMITTED}" "${EXPECT_POPOVER_CLOSED}" <<'PY'
import json
import sys
from pathlib import Path

observation_path, verification_path, result_path, mode, expected, expected_closed = sys.argv[1:]
obs = json.loads(Path(observation_path).read_text())
expected = expected == 'true'
expected_closed = expected_closed == 'true'
verified = (
    obs.get('popover_opened') is True
    and obs.get('typed_value') == '111111'
    and obs.get('popover_closed') is expected_closed
    and obs.get('committed') is expected
    and not obs.get('console_errors')
)
record = {
    'schema_version': '1.0',
    'variant': mode,
    'subject_artifact_sha256': obs.get('subject_artifact_sha256'),
    'precondition': obs.get('precondition', {}),
    'typed_value': obs.get('typed_value'),
    'observed': {
        'popover_opened': obs.get('popover_opened'),
        'popover_closed': obs.get('popover_closed'),
        'committed': obs.get('committed'),
        'swatch_before': obs.get('swatch_before'),
        'swatch_after': obs.get('swatch_after'),
    },
    'console_errors': obs.get('console_errors', []),
    'verified': verified,
    'used_for_scoring': False,
    'observation': 'evidence/observation.json',
    'video': f'evidence/{mode}-video.webm',
    'screenshot': f'evidence/{mode}-screenshot.png',
}
Path(verification_path).write_text(json.dumps(record, indent=2) + '\n')
Path(result_path).write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record, indent=2))
raise SystemExit(0 if verified else 1)
PY

if [[ "${MODE}" == "buggy" ]]; then
  mkdir -p "${SAMPLE_ROOT}/public/evidence"
  cp "${EVIDENCE_DIR}/buggy-screenshot.png" "${SAMPLE_ROOT}/public/evidence/buggy-screenshot.png"
  if [[ -f "${EVIDENCE_DIR}/buggy-video.webm" ]]; then
    cp "${EVIDENCE_DIR}/buggy-video.webm" "${SAMPLE_ROOT}/public/evidence/buggy-video.webm"
  fi
else
  mkdir -p "${SAMPLE_ROOT}/hidden/evidence"
  cp "${EVIDENCE_DIR}/gold-screenshot.png" "${SAMPLE_ROOT}/hidden/evidence/gold-screenshot.png"
  if [[ -f "${EVIDENCE_DIR}/gold-video.webm" ]]; then
    cp "${EVIDENCE_DIR}/gold-video.webm" "${SAMPLE_ROOT}/hidden/evidence/gold-video.webm"
  fi
fi
