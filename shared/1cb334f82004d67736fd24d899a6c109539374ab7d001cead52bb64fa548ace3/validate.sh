#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$MODE" in buggy|fixed|patched) ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
CANONICAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_ROOT="${OUTPUT_DIR}/legacy-run"
rm -rf "$RUN_ROOT"
mkdir -p "$RUN_ROOT"
export SUBJECT_DIR OUTPUT_DIR="$RUN_ROOT" REPRO_VARIANT="$MODE" SUBJECT_VARIANT="$MODE"
LEGACY_MODE="$MODE"
if [[ "$LEGACY_MODE" == fixed ]]; then LEGACY_MODE=gold; fi
set +e
bash "$CANONICAL_ROOT/legacy/construction/scripts/verify_reproduction.sh" "$LEGACY_MODE"
RUN_EXIT=$?
set -e
OBSERVATION="$(find "$RUN_ROOT" -type f -name observation.json -print -quit)"
if [[ -z "$OBSERVATION" ]]; then
  echo "legacy browser reproduction did not produce observation.json" >&2
  exit 1
fi
cp "$OBSERVATION" "$OUTPUT_DIR/observation.json"
python3 - "$OUTPUT_DIR/observation.json" "$MODE" "$RUN_EXIT" <<'PY2'
import json
import sys
path, mode, run_exit_text = sys.argv[1:]
run_exit = int(run_exit_text)
data = json.load(open(path, encoding='utf-8'))
oracle = data.get('oracle_passed')
if oracle is None and isinstance(data.get('oracle'), dict):
    oracle = data['oracle'].get('passed')
if oracle is None:
    oracle = data.get('passed')
if oracle is None:
    oracle = data.get('verified')
observed = data.get('observed') or {}
if oracle is not None:
    bug = not bool(oracle)
elif 'fully_visible' in data:
    bug = not bool(data['fully_visible'])
elif 'listbox_visible_after_header_click' in data:
    bug = data['listbox_visible_after_header_click'] is False
elif 'reopenedValueChanged' in data:
    bug = bool(data['reopenedValueChanged'])
elif 'reopened_value_changed' in observed:
    bug = bool(observed['reopened_value_changed'])
elif 'open_after_scrollbar_click' in observed:
    bug = observed['open_after_scrollbar_click'] is False
else:
    bug = None
environment_valid = run_exit == 0 and bug is not None
record = {
    'schema_version': '1.0',
    'mode': mode,
    'environment_valid': environment_valid,
    'rendering_valid': environment_valid,
    'trigger_valid': bug is not None,
    'bug_observed': bug,
    'legacy_exit_code': run_exit,
    'legacy_observation': data,
    'console_errors': data.get('console_errors', data.get('consoleErrors', [])),
}
json.dump(record, open(path, 'w', encoding='utf-8'), indent=2)
print(json.dumps(record, indent=2))
expected = mode == 'buggy'
if run_exit != 0 or bug is None or bug is not expected:
    raise SystemExit('legacy candidate-aware reproduction predicate mismatch')
PY2
