#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="${REPO_ROOT:?REPO_ROOT must point to the isolated build root}"
INSTANCE_ID="adobe__react-spectrum-9460"
PUBLIC_REPRO="${SAMPLE_ROOT}/public/repro"
MODE="${1:-}"

case "${MODE}" in
  buggy) EXPECT_POINTER=false ;;
  gold) EXPECT_POINTER=true ;;
  *) echo "Usage: bash ${0} [buggy|gold]" >&2; exit 2 ;;
esac

RUN_ROOT="${RUN_ROOT:-${REPO_ROOT}/runs/${INSTANCE_ID}/construction-reproduction-${MODE}}"
EVIDENCE_DIR="${RUN_ROOT}/evidence"
RUNTIME_APP="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-reproduction-${MODE}/app"
BUILD_LOG="${RUN_ROOT}/build.log"
ARTIFACT_JSON="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-${MODE}/artifacts/artifact.json"
RESULT_FILE="${SAMPLE_ROOT}/construction/results/reproduction/${MODE}.json"
mkdir -p "${EVIDENCE_DIR}" "$(dirname "${RESULT_FILE}")"

if [[ "${REUSE_SUBJECT_ARTIFACT:-0}" != "1" || ! -s "${ARTIFACT_JSON}" ]]; then
  bash "${SCRIPT_DIR}/build_subject_package.sh" "${MODE}" >"${BUILD_LOG}"
else
  printf 'Reusing %s\n' "${ARTIFACT_JSON}" >"${BUILD_LOG}"
fi

PACK_PATH="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["pack_path"])' "${ARTIFACT_JSON}")"
PACK_SHA="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["sha256"])' "${ARTIFACT_JSON}")"
PACK_BASENAME="$(basename "${PACK_PATH}")"

rm -rf "${RUNTIME_APP}"
mkdir -p "${RUNTIME_APP}/vendor"
cp -R "${PUBLIC_REPRO}/app/." "${RUNTIME_APP}/"
cp "${PACK_PATH}" "${RUNTIME_APP}/vendor/${PACK_BASENAME}"
python3 -c 'import json,sys; p,b=sys.argv[1:]; d=json.load(open(p)); d.setdefault("dependencies",{})["react-aria-components"]=f"file:./vendor/{b}"; json.dump(d,open(p,"w"),indent=2); print()' "${RUNTIME_APP}/package.json" "${PACK_BASENAME}"

cd "${RUNTIME_APP}"
if [[ -n "${SUBJECT_DIR_OVERRIDE:-}" ]]; then
  export REPRO_EVIDENCE_DIR="${EVIDENCE_DIR}"
  export REPRO_VARIANT="${MODE}"
  export SUBJECT_ARTIFACT_SHA256="${PACK_SHA}"
  if [[ -n "${APP_NODE_MODULES_SOURCE:-}" && -d "${APP_NODE_MODULES_SOURCE/playwright}" ]]; then
    cp -a "${APP_NODE_MODULES_SOURCE}" "${RUNTIME_APP}/node_modules"
  elif [[ -d "${RUNTIME_APP}/node_modules/@playwright/test" ]]; then
    : # The exact legacy app dependencies were baked into the verifier image.
  else
    npm install --no-audit --no-fund --legacy-peer-deps --ignore-scripts
  fi
  rm -rf "${RUNTIME_APP}/node_modules/react-aria-components"
  mkdir -p "${RUNTIME_APP}/node_modules/react-aria-components"
  tar -xzf "${PACK_PATH}" --strip-components=1 -C "${RUNTIME_APP}/node_modules/react-aria-components"
  npx playwright test
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
    -v "${RUNTIME_APP}:/app" \
    -v "${EVIDENCE_DIR}:/evidence" \
    -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    -e REPRO_EVIDENCE_DIR=/evidence \
    -e REPRO_VARIANT="${MODE}" \
    -e SUBJECT_ARTIFACT_SHA256="${PACK_SHA}" \
    "${IMAGE_NAME:-interactrepair-ir-m-006}" \
    -lc 'cd /app && npm install --no-audit --no-fund && npx playwright test'
fi

RESULT_DIR="$(find "${RUNTIME_APP}/test-results" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | head -1 || true)"
VIDEO_PATH=""
if [[ -n "${RESULT_DIR}" && -f "${RESULT_DIR}/video.webm" ]]; then
  VIDEO_PATH="${RESULT_DIR}/video.webm"
  cp "${VIDEO_PATH}" "${EVIDENCE_DIR}/${MODE}-video.webm"
fi
if [[ -n "${RESULT_DIR}" && -f "${RESULT_DIR}/trace.zip" ]]; then
  cp "${RESULT_DIR}/trace.zip" "${EVIDENCE_DIR}/${MODE}-trace.zip"
fi

python3 -c 'import json,sys; obs=json.load(open(sys.argv[1])); out,mode,expected,result=sys.argv[2:]; expected=expected=="true"; verified=(obs.get("pointer_tooltip_visible") is expected and obs.get("focus_tooltip_visible") is True and not obs.get("console_errors")); record={"schema_version":"1.0","variant":mode,"subject_artifact_sha256":obs.get("subject_artifact_sha256"),"precondition":obs.get("precondition",{}),"pointer_tooltip_visible":obs.get("pointer_tooltip_visible"),"focus_tooltip_visible":obs.get("focus_tooltip_visible"),"console_errors":obs.get("console_errors",[]),"verified":verified,"used_for_scoring":False,"observation":"evidence/observation.json","video":f"evidence/{mode}-video.webm","screenshot":f"evidence/{mode}-screenshot.png"}; json.dump(record,open(out,"w"),indent=2); json.dump(record,open(result,"w"),indent=2); print(json.dumps(record,indent=2)); raise SystemExit(0 if verified else 1)' \
  "${EVIDENCE_DIR}/observation.json" "${RUN_ROOT}/verification.json" "${MODE}" "${EXPECT_POINTER}" "${RESULT_FILE}"

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
