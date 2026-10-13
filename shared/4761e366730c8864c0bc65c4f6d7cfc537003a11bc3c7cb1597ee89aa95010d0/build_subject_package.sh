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
PUBLIC_REPRO="${SAMPLE_ROOT}/public/repro"
REPO_ROOT="${REPO_ROOT:?REPO_ROOT must point to the isolated build root}"
INSTANCE_ID="adobe__react-spectrum-9215"
RUNNER_JSON="${SAMPLE_ROOT}/environment/runner.json"
GOLD_PATCH="${GOLD_PATCH:-${SAMPLE_ROOT}/hidden/patches/gold.patch}"
BUGGY_VERSION="3.0.0-nightly-4c91299da-251217"
MODE="${1:-}"
SUBJECT_SOURCE="${SUBJECT_SOURCE:-${REPO_ROOT}/workspaces/_construction/adobe__react-spectrum-9215-base}"

case "${MODE}" in
  buggy|gold) ;;
  *) echo "Usage: bash ${0} [buggy|gold]" >&2; exit 2 ;;
esac

WORK_ROOT="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-${MODE}"
SUBJECT_DIR="${WORK_ROOT}/subject"
ARTIFACT_DIR="${WORK_ROOT}/artifacts"

json_field() {
  python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])' "$1" "$2"
}

REPO_URL="$(json_field "${RUNNER_JSON}" repo_url)"
BASE_COMMIT="$(json_field "${RUNNER_JSON}" base_commit)"

rm -rf "${WORK_ROOT}"
mkdir -p "${WORK_ROOT}" "${ARTIFACT_DIR}"
if [[ -n "${SUBJECT_DIR_OVERRIDE:-}" ]]; then
  SUBJECT_DIR="$(cd "${SUBJECT_DIR_OVERRIDE}" && pwd)"
  cd "${SUBJECT_DIR}/packages/@react-aria/listbox"
  BUGGY_META_DIR="${WORK_ROOT}/buggy-metadata"
  mkdir -p "${BUGGY_META_DIR}"
  BUGGY_PACKAGE_JSON="${PUBLIC_REPRO}/app/node_modules/@react-aria/listbox/package.json"
  if [[ -f "${BUGGY_PACKAGE_JSON}" ]]; then
    cp "${BUGGY_PACKAGE_JSON}" "${WORK_ROOT}/buggy-package.json"
  else
    npm pack "@react-aria/listbox@${BUGGY_VERSION}" --pack-destination "${BUGGY_META_DIR}" >/dev/null
    BUGGY_META_PACK="$(find "${BUGGY_META_DIR}" -maxdepth 1 -type f -name 'react-aria-listbox-*.tgz' -print -quit)"
    tar -xOf "${BUGGY_META_PACK}" package/package.json > "${WORK_ROOT}/buggy-package.json"
  fi
  WORK_ROOT="${WORK_ROOT}" node - <<'NODE'
const fs = require('fs')
const p = 'package.json'
const exact = JSON.parse(fs.readFileSync(p))
const nightly = JSON.parse(fs.readFileSync(process.env.WORK_ROOT + '/buggy-package.json'))
const d = {...nightly, ...exact}
d.version = nightly.version
d.dependencies = nightly.dependencies
d.peerDependencies = nightly.peerDependencies
d.main = './src/index.ts'
d.module = './src/index.ts'
d.types = './src/index.ts'
d.exports = './src/index.ts'
d.files = ['src']
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n')
NODE
  npm pack --pack-destination "${ARTIFACT_DIR}" >/dev/null
  PACK_PATH="$(find "${ARTIFACT_DIR}" -maxdepth 1 -type f -name 'react-aria-listbox-*.tgz' -print -quit)"
  SOURCE="exact prepared subject checkout"
  SOURCE_VERIFIED="true"
else
  if [[ -n "${SUBJECT_SOURCE}" && -d "${SUBJECT_SOURCE}/.git" ]]; then
    git clone --no-hardlinks "${SUBJECT_SOURCE}" "${SUBJECT_DIR}"
  else
    git clone --filter=blob:none "${REPO_URL}" "${SUBJECT_DIR}"
  fi
  git -C "${SUBJECT_DIR}" checkout --detach "${BASE_COMMIT}"

  if [[ "${MODE}" == "buggy" ]]; then
    PACK_FILE="$(npm pack "@react-aria/listbox@${BUGGY_VERSION}" --pack-destination "${ARTIFACT_DIR}")"
    PACK_PATH="${ARTIFACT_DIR}/${PACK_FILE}"
    VERIFY_DIR="${WORK_ROOT}/source-verification"
    mkdir -p "${VERIFY_DIR}"
    tar -xzf "${PACK_PATH}" -C "${VERIFY_DIR}"
    diff -qr "${VERIFY_DIR}/package/src" "${SUBJECT_DIR}/packages/@react-aria/listbox/src"
    SOURCE="npm:@react-aria/listbox@${BUGGY_VERSION}; complete src tree verified byte-identical to base"
    SOURCE_VERIFIED="true"
  else
    git -C "${SUBJECT_DIR}" apply --check "${GOLD_PATCH}"
    git -C "${SUBJECT_DIR}" apply "${GOLD_PATCH}"
    cd "${SUBJECT_DIR}"
    corepack enable
    corepack prepare yarn@4.2.2 --activate
    yarn install --immutable
    yarn build
    cd "${SUBJECT_DIR}/packages/@react-aria/listbox"
    PACK_FILE="$(npm pack --pack-destination "${ARTIFACT_DIR}")"
    PACK_PATH="${ARTIFACT_DIR}/${PACK_FILE}"
    SOURCE="exact base checkout plus gold.patch"
    SOURCE_VERIFIED="true"
  fi
fi

SHA256="$(shasum -a 256 "${PACK_PATH}" | awk '{print $1}')"
python3 -c 'import json,sys; json.dump({"pack_path":sys.argv[2],"sha256":sys.argv[3],"base_commit":sys.argv[4],"variant":sys.argv[5],"package":"@react-aria/listbox","source":sys.argv[6],"source_verified":sys.argv[7] == "true"},open(sys.argv[1],"w"),indent=2); print()' \
  "${ARTIFACT_DIR}/artifact.json" "${PACK_PATH}" "${SHA256}" "${BASE_COMMIT}" "${MODE}" "${SOURCE}" "${SOURCE_VERIFIED}"
echo "${PACK_PATH}"
