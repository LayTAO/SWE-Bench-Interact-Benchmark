#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="${REPO_ROOT:?REPO_ROOT must point to the isolated build root}"
INSTANCE_ID="adobe__react-spectrum-9460"
IMAGE_NAME="${IMAGE_NAME:-interactrepair-ir-m-006}"
GOLD_PATCH="${GOLD_PATCH:-${SAMPLE_ROOT}/hidden/patches/gold.patch}"
BASE_COMMIT="6aee49af22267e1dfae14c7c2b3d39397a720e9a"
MODE="${1:-}"

case "${MODE}" in
  buggy|gold) ;;
  *) echo "Usage: bash ${0} [buggy|gold]" >&2; exit 2 ;;
esac

WORK_ROOT="${REPO_ROOT}/workspaces/${INSTANCE_ID}/construction-${MODE}"
ARTIFACT_DIR="${WORK_ROOT}/artifacts"
rm -rf "${WORK_ROOT}"
mkdir -p "${ARTIFACT_DIR}"

if [[ -n "${SUBJECT_DIR_OVERRIDE:-}" ]]; then
  SUBJECT_DIR="$(cd "${SUBJECT_DIR_OVERRIDE}" && pwd)"
  cd "${SUBJECT_DIR}"
  yarn parcel build packages/react-aria-components --no-optimize --config .parcelrc-build
  node -e 'const fs=require("fs"); const p="packages/react-aria-components/package.json"; const d=JSON.parse(fs.readFileSync(p)); if (d.exports && d.exports["."] && d.exports["."].import && !fs.existsSync("packages/react-aria-components/" + d.exports["."].import)) d.exports["."].import="./dist/module.js"; fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");'
  cd packages/react-aria-components
  npm pack --pack-destination "${ARTIFACT_DIR}" >/dev/null
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

  "${ENGINE}" run --rm --entrypoint bash \
    -v "${ARTIFACT_DIR}:/out" \
    -v "${GOLD_PATCH}:/tmp/gold.patch:ro" \
    "${IMAGE_NAME}" \
    -lc "set -euo pipefail; cd /workspace/repo; git reset --hard; git clean -fd; git checkout ${BASE_COMMIT}; if [[ '${MODE}' == 'gold' ]]; then git apply --check /tmp/gold.patch; git apply /tmp/gold.patch; fi; corepack enable; corepack prepare yarn@4.2.2 --activate; yarn parcel build packages/react-aria-components --no-optimize --config .parcelrc-build; node -e 'const fs=require(\"fs\"); const p=\"packages/react-aria-components/package.json\"; const d=JSON.parse(fs.readFileSync(p)); if (d.exports && d.exports[\".\"] && d.exports[\".\"].import && !fs.existsSync(\"packages/react-aria-components/\" + d.exports[\".\"].import)) d.exports[\".\"].import=\"./dist/module.js\"; fs.writeFileSync(p, JSON.stringify(d, null, 2) + \"\\n\");'; cd packages/react-aria-components; npm pack --pack-destination /out"
fi

PACK_PATH="$(find "${ARTIFACT_DIR}" -maxdepth 1 -type f -name 'react-aria-components-*.tgz' -print -quit)"
if [[ -z "${PACK_PATH}" || ! -s "${PACK_PATH}" ]]; then
  echo "react-aria-components package was not created" >&2
  exit 1
fi
PACK_SHA="$(shasum -a 256 "${PACK_PATH}" | awk '{print $1}')"
python3 -c 'import json,sys; out,pack,sha,base,variant=sys.argv[1:]; json.dump({"pack_path":pack,"sha256":sha,"base_commit":base,"variant":variant,"package":"react-aria-components","build":"yarn parcel build packages/react-aria-components --no-optimize --config .parcelrc-build"},open(out,"w"),indent=2); print()' \
  "${ARTIFACT_DIR}/artifact.json" "${PACK_PATH}" "${PACK_SHA}" "${BASE_COMMIT}" "${MODE}"
