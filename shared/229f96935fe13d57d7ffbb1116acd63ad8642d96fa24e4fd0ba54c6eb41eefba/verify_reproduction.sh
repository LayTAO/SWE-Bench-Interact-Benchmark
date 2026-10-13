#!/usr/bin/env bash
set -euo pipefail

for candidate in /opt/homebrew/bin /usr/local/bin; do
  if [[ -x "${candidate}/node" ]]; then
    export PATH="${candidate}:${PATH}"
    break
  fi
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="${REPO_ROOT:?REPO_ROOT must point to the isolated build root}"
INSTANCE_ID="adobe__react-spectrum-7960"
PUBLIC_REPRO="${SAMPLE_ROOT}/public/repro"
MODE="${1:-}"

case "${MODE}" in
  buggy) EXPECTED_PLACEMENT="bottom"; EXPECTED_VISIBLE="false" ;;
  gold) EXPECTED_PLACEMENT="top"; EXPECTED_VISIBLE="true" ;;
  *) echo "Usage: bash ${0} [buggy|gold]" >&2; exit 2 ;;
esac

RUN_ROOT="${RUN_ROOT:-${REPO_ROOT}/runs/${INSTANCE_ID}/construction-reproduction-${MODE}}"
EVIDENCE_DIR="${RUN_ROOT}/evidence"
RUNTIME_APP="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-reproduction/app"
BUILD_LOG="${RUN_ROOT}/build.log"
mkdir -p "${EVIDENCE_DIR}"

ARTIFACT_JSON="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-${MODE}/artifacts/artifact.json"
if [[ -n "${SUBJECT_DIR_OVERRIDE:-}" ]]; then
  SUBJECT_DIR="$(cd "${SUBJECT_DIR_OVERRIDE}" && pwd)"
  SUBJECT_COMMIT="$(git -C "${SUBJECT_DIR}" rev-parse HEAD)"
  printf 'Using prebuilt subject checkout %s\n' "${SUBJECT_DIR}" > "${BUILD_LOG}"
else
  if [[ "${REUSE_SUBJECT_ARTIFACT:-0}" != "1" || ! -s "${ARTIFACT_JSON}" ]]; then
    SUBJECT_SOURCE="${SUBJECT_SOURCE:-}" bash "${SCRIPT_DIR}/build_subject_package.sh" "${MODE}" > "${BUILD_LOG}"
  else
    printf 'Reusing %s\n' "${ARTIFACT_JSON}" > "${BUILD_LOG}"
  fi

  SUBJECT_DIR="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["subject_dir"])' "${ARTIFACT_JSON}")"
  SUBJECT_COMMIT="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["base_commit"])' "${ARTIFACT_JSON}")"
fi

rm -rf "${RUNTIME_APP}"
mkdir -p "${RUNTIME_APP}"
tar --exclude=test-results --exclude=playwright-report \
  -C "${PUBLIC_REPRO}/app" -cf - . | tar -C "${RUNTIME_APP}" -xf -

cd "${RUNTIME_APP}"
if [[ ! -d node_modules ]]; then
  echo "canonical repro dependencies were not baked into the verifier image" >&2
  exit 1
fi
rm -rf node_modules/.vite
SUBJECT_DIR="${SUBJECT_DIR}" \
  npm run build
SUBJECT_DIR="${SUBJECT_DIR}" \
  SUBJECT_COMMIT="${SUBJECT_COMMIT}" \
  REPRO_EVIDENCE_DIR="${EVIDENCE_DIR}" \
  REPRO_VARIANT="${MODE}" \
  STATIC_REPRO="1" \
  npm run test:e2e

RESULT_DIR="$(find "${RUNTIME_APP}/test-results" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | head -1)"
if [[ -n "${RESULT_DIR}" ]]; then
  [[ -f "${RESULT_DIR}/video.webm" ]] && cp "${RESULT_DIR}/video.webm" "${EVIDENCE_DIR}/${MODE}-video.webm"
  [[ -f "${RESULT_DIR}/trace.zip" ]] && cp "${RESULT_DIR}/trace.zip" "${EVIDENCE_DIR}/${MODE}-trace.zip"
fi

python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); expected_placement=sys.argv[2]; expected_visible=sys.argv[3]=="true"; ok=d["placement"]==expected_placement and d["fully_visible"] is expected_visible and not d["console_errors"]; out={"schema_version":"1.0","variant":sys.argv[4],"subject_commit":d["subject_commit"],"placement":d["placement"],"fully_visible":d["fully_visible"],"popover":d["popover"],"viewport":d["viewport"],"console_errors":d["console_errors"],"verified":ok,"used_for_scoring":False,"observation":"evidence/observation.json","video":f"evidence/{sys.argv[4]}-video.webm","screenshot":f"evidence/{sys.argv[4]}-screenshot.png"}; open(sys.argv[5],"w").write(json.dumps(out,indent=2)+"\n"); print(json.dumps(out,indent=2)); raise SystemExit(0 if ok else 1)' \
  "${EVIDENCE_DIR}/observation.json" "${EXPECTED_PLACEMENT}" "${EXPECTED_VISIBLE}" "${MODE}" "${RUN_ROOT}/verification.json"
