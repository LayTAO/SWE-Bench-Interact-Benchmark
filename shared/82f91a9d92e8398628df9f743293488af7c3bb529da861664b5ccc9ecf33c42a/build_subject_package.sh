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
BASE_COMMIT="05346a6a6f16f2e853ef01bed9149381eebedf26"
GOLD_PATCH="${GOLD_PATCH:-${SAMPLE_ROOT}/hidden/patches/gold.patch}"
MODE="${1:-}"
SUBJECT_SOURCE="${SUBJECT_SOURCE:-}"

case "${MODE}" in
  buggy|gold) ;;
  *) echo "Usage: bash ${0} [buggy|gold]" >&2; exit 2 ;;
esac

WORK_ROOT="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-${MODE}"
SUBJECT_DIR="${WORK_ROOT}/subject"
ARTIFACT_DIR="${WORK_ROOT}/artifacts"
rm -rf "${WORK_ROOT}"
mkdir -p "${WORK_ROOT}" "${ARTIFACT_DIR}"

if [[ -n "${SUBJECT_SOURCE}" ]] && git -C "${SUBJECT_SOURCE}" rev-parse --git-dir >/dev/null 2>&1; then
  git clone --shared "${SUBJECT_SOURCE}" "${SUBJECT_DIR}"
else
  git clone --filter=blob:none https://github.com/adobe/react-spectrum.git "${SUBJECT_DIR}"
fi

git -C "${SUBJECT_DIR}" checkout "${BASE_COMMIT}"
if [[ "${MODE}" == "gold" ]]; then
  git -C "${SUBJECT_DIR}" apply --check "${GOLD_PATCH}"
  git -C "${SUBJECT_DIR}" apply "${GOLD_PATCH}"
fi

cd "${SUBJECT_DIR}"
node .yarn/releases/yarn-4.2.2.cjs install --immutable

SOURCE_FILE="${SUBJECT_DIR}/packages/@react-aria/overlays/src/calculatePosition.ts"
SHA256="$(shasum -a 256 "${SOURCE_FILE}" | awk '{print $1}')"
python3 -c 'import json,sys; json.dump({"subject_dir":sys.argv[2],"sha256":sys.argv[3],"base_commit":sys.argv[4],"variant":sys.argv[5]},open(sys.argv[1],"w"),indent=2); print()' \
  "${ARTIFACT_DIR}/artifact.json" "${SUBJECT_DIR}" "${SHA256}" "${BASE_COMMIT}" "${MODE}"
echo "${SUBJECT_DIR}"
