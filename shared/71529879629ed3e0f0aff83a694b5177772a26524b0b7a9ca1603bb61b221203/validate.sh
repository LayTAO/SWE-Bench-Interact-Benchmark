#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh buggy|fixed|patched}"
case "$MODE" in buggy) variant=buggy ;; fixed|patched) variant=gold ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN_ROOT="$OUTPUT_DIR/legacy-run"
mkdir -p "$RUN_ROOT"
set +e
SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_DIR="$RUN_ROOT" REPRO_VARIANT="$variant" \
  CHROMIUM_EXECUTABLE="${CHROMIUM_EXECUTABLE:-/ms-playwright/chromium-1208/chrome-linux64/chrome}" \
  bash "$ROOT/legacy/public/repro/scripts/run.sh"
run_exit=$?
set -e
observation="$(find "$RUN_ROOT" -type f -name observation.json -print -quit)"
[[ -n "$observation" ]] || { echo 'browser reproduction did not produce observation.json' >&2; exit 1; }
cp "$observation" "$OUTPUT_DIR/observation.json"
python3 - "$OUTPUT_DIR/observation.json" "$MODE" "$run_exit" <<'PY'
import json, sys
path, mode, exit_text = sys.argv[1:]
data = json.load(open(path, encoding='utf-8'))
passed = data.get('oracle', {}).get('passed')
bug = None if passed is None else not bool(passed)
record = {
  'schema_version': '1.0', 'mode': mode,
  'environment_valid': int(exit_text) == 0 and bug is not None,
  'rendering_valid': bug is not None,
  'trigger_valid': bug is not None,
  'bug_observed': bug,
  'legacy_exit_code': int(exit_text),
  'legacy_observation': data,
  'console_errors': data.get('console_errors', []),
  'page_errors': data.get('page_errors', []),
}
json.dump(record, open(path, 'w', encoding='utf-8'), indent=2)
print(json.dumps(record, indent=2))
if int(exit_text) != 0 or bug is None or bug is not (mode == 'buggy'):
  raise SystemExit('canonical browser predicate mismatch')
PY
