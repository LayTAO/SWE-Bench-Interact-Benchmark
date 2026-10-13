#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh buggy|fixed|patched}"
case "$MODE" in buggy|fixed|patched) ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?prepared candidate source is required}"
: "${OUTPUT_DIR:?output directory is required}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$OUTPUT_DIR"
rm -f /oracle
find /tooling -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
ln -s "$ROOT/legacy/public/repro/app" /oracle
cp -a "$ROOT/legacy/public/repro/tooling/." /tooling/
[[ "$(realpath /subject)" == "$(realpath "$SUBJECT_DIR")" ]]
[[ "$(realpath /results)" == "$(realpath "$OUTPUT_DIR")" ]]
case "$MODE" in buggy) variant=buggy ;; fixed|patched) variant=gold ;; esac
export INSTANCE_ID=radix-ui__primitives-3971 REPRO_VARIANT="$variant"
export CHROMIUM_EXECUTABLE="${CHROMIUM_EXECUTABLE:-/opt/chrome-149/chrome-linux64/chrome}"
bash "$ROOT/legacy/public/repro/scripts/container.sh"
python3 - "$OUTPUT_DIR/observation.json" "$MODE" <<'PY'
import json
import sys

path, mode = sys.argv[1:]
data = json.load(open(path, encoding='utf-8'))
states = {
    'initial': data.get('initial_state'),
    'final': data.get('state_after_outside_click'),
}
healthy = (
    data.get('action_error') is None
    and not data.get('console_errors', [])
    and not data.get('page_errors', [])
    and states['initial'] == 'parent: open | child: open'
)
bug = states['final'] == 'parent: closed | child: closed' if healthy else None
if healthy and states['final'] not in {
    'parent: closed | child: closed',
    'parent: open | child: closed',
}:
    bug = None
record = {
    'schema_version': '1.0', 'mode': mode,
    'environment_valid': healthy and bug is not None,
    'rendering_valid': healthy,
    'trigger_valid': healthy,
    'bug_observed': bug,
    'page_errors': data.get('page_errors', []),
    'console_errors': data.get('console_errors', []),
    'action_error': data.get('action_error'),
    'states': states,
    'legacy_observation': data,
}
json.dump(record, open(path, 'w', encoding='utf-8'), indent=2)
print(json.dumps(record, indent=2))
if not record['environment_valid'] or bug is not (mode == 'buggy'):
    raise SystemExit('canonical state predicate mismatch')
PY
