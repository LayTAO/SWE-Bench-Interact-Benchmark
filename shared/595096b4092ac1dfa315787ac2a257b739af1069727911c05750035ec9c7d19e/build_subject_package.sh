#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="${REPO_ROOT:?REPO_ROOT must point to the isolated build root}"
INSTANCE_ID="adobe__react-spectrum-9748"
IMAGE_NAME="${IMAGE_NAME:-interactrepair-ir-m-008}"
GOLD_PATCH="${GOLD_PATCH:-${SAMPLE_ROOT}/hidden/patches/gold.patch}"
BASE_COMMIT="80ef0d833d85f3897cfbab2b00291bf85f42e46a"
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
  node - <<'NODE'
const fs = require('fs');
const p = 'packages/@react-aria/overlays/package.json';
const d = JSON.parse(fs.readFileSync(p));
d.main = './src/index.ts';
d.module = './src/index.ts';
d.exports = {source: './src/index.ts', types: './src/index.ts', import: './src/index.ts', require: './src/index.ts'};
delete d.targets;
d.files = ['src', 'intl'];
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
const dismiss = 'packages/@react-aria/overlays/src/DismissButton.tsx';
const source = fs.readFileSync(dismiss, 'utf8');
  fs.writeFileSync(dismiss, source.replace("import intlMessages from '../intl/*.json';", "const intlMessages = {'en-US': {dismiss: 'Dismiss'}};"));
NODE
  # The repository checkout stores Spectrum icon SVGs but not the generated
  # JS entry points consumed by the Parcel reproduction. Generate only this
  # workspace package in the disposable candidate checkout.
  export PATH="${SUBJECT_DIR}/node_modules/.bin:${PATH}"
  yarn workspace @spectrum-icons/ui make-icons
  yarn workspace @spectrum-icons/ui build-icons
  # npm pack uses the already-installed exact checkout; avoid a network-only
  # Corepack download in the isolated Playwright container.
  (cd packages/@react-aria/overlays && npm pack --pack-destination "${ARTIFACT_DIR}")
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
    -lc "set -euo pipefail; cd /workspace/repo; git reset --hard; git clean -fd; git checkout ${BASE_COMMIT}; if [[ '${MODE}' == 'gold' ]]; then git apply --check /tmp/gold.patch; git apply /tmp/gold.patch; fi; node - <<'NODE'
const fs = require('fs');
const p = 'packages/@react-aria/overlays/package.json';
const d = JSON.parse(fs.readFileSync(p));
d.main = './src/index.ts';
d.module = './src/index.ts';
d.exports = {source: './src/index.ts', types: './src/index.ts', import: './src/index.ts', require: './src/index.ts'};
delete d.targets;
d.files = ['src', 'intl'];
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\\n');
const dismiss = 'packages/@react-aria/overlays/src/DismissButton.tsx';
const source = fs.readFileSync(dismiss, 'utf8');
fs.writeFileSync(dismiss, source.replace(\"import intlMessages from '../intl/*.json';\", \"const intlMessages = {'en-US': {dismiss: 'Dismiss'}};\"));
NODE
corepack enable; corepack prepare yarn@4.2.2 --activate; (cd packages/@react-aria/overlays && npm pack --pack-destination /out)"
fi

python3 - "${ARTIFACT_DIR}" "${BASE_COMMIT}" "${MODE}" <<'PY'
import hashlib
import json
import sys
from pathlib import Path

out = Path(sys.argv[1])
base = sys.argv[2]
variant = sys.argv[3]
packs = sorted(out.glob('*.tgz'))
if len(packs) != 1:
    raise SystemExit(f'expected one subject package, found {len(packs)}: {packs}')
pack_paths = {}
sha = {}
prefixes = {'react-aria-overlays-': '@react-aria/overlays'}
for pack in packs:
    name = next((value for prefix, value in prefixes.items() if pack.name.startswith(prefix)), None)
    if name is None:
        raise SystemExit(f'unexpected artifact: {pack.name}')
    pack_paths[name] = str(pack)
    sha[name] = hashlib.sha256(pack.read_bytes()).hexdigest()
sha['combined'] = hashlib.sha256('\n'.join(sha[k] for k in sorted(pack_paths)).encode()).hexdigest()
payload = {
    'pack_paths': pack_paths,
    'sha256': sha,
    'base_commit': base,
    'variant': variant,
    'packages': sorted(pack_paths),
    'build': 'npm pack of exact @react-aria/overlays source after applying the variant patch',
}
(out / 'artifact.json').write_text(json.dumps(payload, indent=2) + '\n')
print(json.dumps(payload, indent=2))
PY
