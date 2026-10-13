#!/usr/bin/env bash
set -euo pipefail

for candidate in /opt/homebrew/bin /usr/local/bin; do
  if [[ -x "${candidate}/node" ]]; then
    export PATH="${candidate}:${PATH}"
    break
  fi
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPRO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${REPRO_ROOT}/../../../.." && pwd)"
INSTANCE_ID="adobe__react-spectrum-7960"
SOURCE_APP="${REPRO_ROOT}/app"
RUNTIME_APP="${REPO_ROOT}/workspaces/${INSTANCE_ID}/public-reproduction/app"
RUN_ROOT="${RUN_ROOT:-${REPO_ROOT}/runs/${INSTANCE_ID}/public-reproduction}"
EVIDENCE_DIR="${RUN_ROOT}/evidence"
MODE="${1:-test}"

if [[ -z "${SUBJECT_DIR:-}" ]]; then
  echo "Set SUBJECT_DIR to an adobe/react-spectrum checkout before running the canonical reproduction." >&2
  exit 2
fi

rm -rf "${RUNTIME_APP}"
mkdir -p "${RUNTIME_APP}" "${EVIDENCE_DIR}"
rsync -a \
  --exclude node_modules \
  --exclude test-results \
  --exclude playwright-report \
  "${SOURCE_APP}/" "${RUNTIME_APP}/"

cd "${RUNTIME_APP}"
if [[ ! -d node_modules ]]; then
  echo "canonical repro dependencies were not baked into the verifier image" >&2
  exit 1
fi

case "${MODE}" in
  test)
    SUBJECT_DIR="${SUBJECT_DIR}" npm run build
    REPRO_EVIDENCE_DIR="${EVIDENCE_DIR}" \
      REPRO_VARIANT="buggy" \
      SUBJECT_DIR="${SUBJECT_DIR}" \
      STATIC_REPRO="1" \
      npm run test:e2e
    ;;
  serve)
    exec env SUBJECT_DIR="${SUBJECT_DIR}" npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
    ;;
  *)
    echo "Usage: bash ${0} [test|serve]" >&2
    exit 2
    ;;
esac
