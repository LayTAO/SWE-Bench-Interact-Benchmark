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

# COMPLETE_CANDIDATE_WORKSPACE
: "${SUBJECT_DIR_OVERRIDE:?complete prepared candidate is required}"
export SUBJECT_DIR="$(cd "$SUBJECT_DIR_OVERRIDE" && pwd -P)"
export SUBJECT_DIR_OVERRIDE="$SUBJECT_DIR"
rm -rf "$RUNTIME_APP"
mkdir -p "$RUNTIME_APP"
cp -R "$PUBLIC_REPRO/app/." "$RUNTIME_APP/"
export REPRO_EVIDENCE_DIR="$EVIDENCE_DIR" REPRO_VARIANT="$MODE"
REPRO_ROOT="$SUBJECT_DIR/.ir-m-008-repro"
mkdir -p "$REPRO_ROOT"
cp -R "$RUNTIME_APP/." "$REPRO_ROOT/"
RUNTIME_APP="$REPRO_ROOT"
SUBJECT_ARTIFACT_SHA256="$(node "$RUNTIME_APP/parcel-candidate-workspace.mjs" "$SUBJECT_DIR" "$EVIDENCE_DIR")"
export SUBJECT_ARTIFACT_SHA256
cd "$RUNTIME_APP"
node "$SUBJECT_DIR/node_modules/playwright/cli.js" test

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
