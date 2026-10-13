#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?buggy or fixed}"
SUBJECT_DIR="${2:?subject directory}"
OUTPUT_DIR="${3:?output directory}"
CANONICAL_ROOT=/tests/canonical_repro
CANONICAL_SUBJECT_PATH=''
mkdir -p "$OUTPUT_DIR" "$OUTPUT_DIR/results" /state-cache /tooling
rm -rf /tooling
ln -sfn "$CANONICAL_ROOT" /oracle
ln -sfn "$SUBJECT_DIR" /subject
ln -sfn "$OUTPUT_DIR" /results
export SUBJECT_DIR OUTPUT_DIR REPRO_MODE="$MODE" REPRO_VARIANT="$MODE"
if [[ "$MODE" == buggy ]]; then EXPECT_BUG=true; else EXPECT_BUG=false; fi
export EXPECT_BUG
export CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
export CONTAINER_ENGINE=/usr/local/bin/docker
if [[ -n "$CANONICAL_SUBJECT_PATH" ]]; then
  package_dir="$SUBJECT_DIR/$CANONICAL_SUBJECT_PATH"
  [[ -d "$package_dir" ]] || { echo "canonical subject package is missing: $package_dir" >&2; exit 2; }
  find /state-cache -maxdepth 1 -type f -name '*.tgz' -delete
  (cd "$package_dir" && npm pack --pack-destination /state-cache > /state-cache/subject-artifact.pack.log 2>&1)
  SUBJECT_ARTIFACT="$(find /state-cache -maxdepth 1 -type f -name '*.tgz' -print | head -n 1)"
  [[ -n "$SUBJECT_ARTIFACT" ]] || { echo "npm pack did not produce SUBJECT_ARTIFACT" >&2; exit 2; }
  export SUBJECT_ARTIFACT
fi
if [[ -x "$CANONICAL_ROOT/scripts/container.sh" ]]; then
  # Some accepted container runners were originally invoked with these
  # bind-mount names by validate.sh.  Recreate the same names when the
  # verifier executes the runner directly, without exposing verifier files to
  # the Agent image.
  rm -rf /oracle-src /tooling
  ln -sfn "$CANONICAL_ROOT/app" /oracle-src
  ln -sfn "$CANONICAL_ROOT/tooling" /tooling
  bash "$CANONICAL_ROOT/scripts/container.sh" "$MODE" >"$OUTPUT_DIR/canonical.log" 2>&1
else
  set +e
  bash "$CANONICAL_ROOT/scripts/validate.sh" "$MODE" >"$OUTPUT_DIR/canonical.log" 2>&1
  legacy_status=$?
  set -e
  python3 - "$OUTPUT_DIR/results/observation.json" "$OUTPUT_DIR/observation.json" "$MODE" "$legacy_status" <<'PY'
import json
import pathlib
import sys

source, target, mode, exit_text = sys.argv[1:]
try:
    raw = json.loads(pathlib.Path(source).read_text())
except (OSError, ValueError):
    raise SystemExit('Accepted browser observation is missing or malformed')
browser_ok = (
    raw.get('instance_id') == 'IR-M-113'
    and raw.get('variant') == mode
    and raw.get('chromium_version') == '145.0.7632.6'
    and raw.get('viewport') == {'width': 960, 'height': 720}
    and raw.get('workers') == 1 and raw.get('retries') == 0
)
rendering_ok = (
    isinstance(raw.get('active_after_cancel'), dict)
    and all(isinstance(raw.get(key), str) for key in
            ('value_after_manual_input', 'value_after_blur', 'model_end'))
)
trigger_ok = raw.get('action') == (
    'Open the range TimePicker, cancel, enter 07:40:00 in the end field, then move focus outside'
)
healthy = (browser_ok and rendering_ok and trigger_ok
           and raw.get('console_errors') == []
           and type(raw.get('oracle_passed')) is bool
           and int(exit_text) in (0, 9))
bug = not raw['oracle_passed'] if type(raw.get('oracle_passed')) is bool else None
record = {
    'schema_version': '1.0', 'mode': mode,
    'environment_valid': healthy, 'rendering_valid': rendering_ok,
    'trigger_valid': trigger_ok, 'bug_observed': bug,
    'legacy_exit_code': int(exit_text), 'legacy_observation': raw,
}
pathlib.Path(target).write_text(json.dumps(record, indent=2) + '\n')
if not healthy:
    raise SystemExit('Accepted browser health or assertion evidence invalid')
if bug is not (mode == 'buggy'):
    raise SystemExit('Accepted target behavior persists')
PY
fi
