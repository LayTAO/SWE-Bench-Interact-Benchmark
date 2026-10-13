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
INSTANCE_ID="adobe__react-spectrum-9215"
PUBLIC_REPRO="${SAMPLE_ROOT}/public/repro"
MODE="${1:-}"

case "${MODE}" in
  buggy) EXPECTED_LISTBOX=false ;;
  gold) EXPECTED_LISTBOX=true ;;
  *) echo "Usage: bash ${0} [buggy|gold]" >&2; exit 2 ;;
esac

RUN_ROOT="${RUN_ROOT:-${REPO_ROOT}/runs/${INSTANCE_ID}/construction-reproduction-${MODE}}"
EVIDENCE_DIR="${RUN_ROOT}/evidence"
RUNTIME_APP="${RUNTIME_APP:-${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-reproduction-${MODE}/app}"
BUILD_LOG="${RUN_ROOT}/build.log"
mkdir -p "${EVIDENCE_DIR}"

ARTIFACT_JSON="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-${MODE}/artifacts/artifact.json"
if [[ "${REUSE_SUBJECT_ARTIFACT:-0}" != "1" || ! -s "${ARTIFACT_JSON}" ]]; then
  SUBJECT_SOURCE="${SUBJECT_SOURCE:-}" bash "${SCRIPT_DIR}/build_subject_package.sh" "${MODE}" > "${BUILD_LOG}"
else
  printf 'Reusing %s\n' "${ARTIFACT_JSON}" > "${BUILD_LOG}"
fi
PACK_PATH="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["pack_path"])' "${ARTIFACT_JSON}")"
ARTIFACT_SHA256="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["sha256"])' "${ARTIFACT_JSON}")"
PACK_BASENAME="$(basename "${PACK_PATH}")"

rm -rf "${RUNTIME_APP}"
mkdir -p "${RUNTIME_APP}/vendor"
tar --exclude=test-results --exclude=playwright-report \
  -C "${PUBLIC_REPRO}/app" -cf - . | tar -C "${RUNTIME_APP}" -xf -
rm -f "${RUNTIME_APP}/package-lock.json"
cp "${PACK_PATH}" "${RUNTIME_APP}/vendor/${PACK_BASENAME}"
python3 - <<PY
import json
from pathlib import Path
pkg_path = Path("${RUNTIME_APP}/package.json")
data = json.loads(pkg_path.read_text())
data.setdefault("dependencies", {})
data["dependencies"]["@react-aria/listbox"] = "file:./vendor/${PACK_BASENAME}"
overrides = data.setdefault("overrides", {})
overrides["@react-aria/listbox"] = "file:./vendor/${PACK_BASENAME}"
pkg_path.write_text(json.dumps(data, indent=2) + "\n")
PY

cd "${RUNTIME_APP}"
if [[ ! -d node_modules ]]; then
  echo "canonical repro dependencies were not baked into the verifier image" >&2
  exit 1
fi
rm -rf "${RUNTIME_APP}/node_modules/@react-aria/listbox"
mkdir -p "${RUNTIME_APP}/node_modules/@react-aria/listbox"
tar -xzf "${PACK_PATH}" --strip-components=1 -C "${RUNTIME_APP}/node_modules/@react-aria/listbox"
REPRO_EVIDENCE_DIR="${EVIDENCE_DIR}" \
  REPRO_VARIANT="${MODE}" \
  SUBJECT_ARTIFACT_SHA256="${ARTIFACT_SHA256}" \
  npx playwright test

RESULT_DIR="$(find "${RUNTIME_APP}/test-results" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | head -1 || true)"
if [[ -n "${RESULT_DIR}" ]]; then
  [[ -f "${RESULT_DIR}/video.webm" ]] && cp "${RESULT_DIR}/video.webm" "${EVIDENCE_DIR}/${MODE}-video.webm"
  [[ -f "${RESULT_DIR}/trace.zip" ]] && cp "${RESULT_DIR}/trace.zip" "${EVIDENCE_DIR}/${MODE}-trace.zip"
fi

python3 - <<PY
import json
from pathlib import Path
obs = json.loads(Path("${EVIDENCE_DIR}/observation.json").read_text())
expected_listbox = "${EXPECTED_LISTBOX}" == "true"
pre = obs["listbox_visible_before_header_click"] is True
post = obs["listbox_visible_after_header_click"] is expected_listbox
clean = not obs["console_errors"]
ok = pre and post and clean
out = {
  "schema_version": "1.0",
  "variant": "${MODE}",
  "subject_artifact_sha256": obs.get("subject_artifact_sha256"),
  "precondition": {"listbox_visible": obs["listbox_visible_before_header_click"]},
  "expected_after_header_click": {"listbox_visible": expected_listbox},
  "observed_after_header_click": {"listbox_visible": obs["listbox_visible_after_header_click"]},
  "console_errors": obs["console_errors"],
  "verified": ok,
  "used_for_scoring": False,
  "observation": "evidence/observation.json",
  "video": f"evidence/${MODE}-video.webm",
  "screenshot": f"evidence/${MODE}-screenshot.png",
}
Path("${RUN_ROOT}/verification.json").write_text(json.dumps(out, indent=2) + "\n")
print(json.dumps(out, indent=2))
raise SystemExit(0 if ok else 1)
PY
