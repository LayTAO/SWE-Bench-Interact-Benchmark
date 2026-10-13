#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$MODE" in buggy|fixed|patched) ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
CANONICAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_ROOT="${OUTPUT_DIR}/runtime"
RUN_ROOT="${OUTPUT_DIR}/legacy-run"
rm -rf "$RUNTIME_ROOT" "$RUN_ROOT"
mkdir -p "$RUNTIME_ROOT" "$RUN_ROOT"
cp -R "$CANONICAL_ROOT/legacy" "$RUNTIME_ROOT/legacy"
mkdir -p "$RUNTIME_ROOT/repo-root"
export REPO_ROOT="$RUNTIME_ROOT/repo-root"
case "$MODE" in
  buggy) LEGACY_VARIANT=buggy; EXPECTED_BUG=true ;;
  fixed|patched) LEGACY_VARIANT=gold; EXPECTED_BUG=false ;;
esac
# Some historical artifact routes accept an exact checkout through this
# explicit override.  No fixed commit or patch is applied here.
if { [[ -f "$RUNTIME_ROOT/legacy/construction/scripts/build_subject_package.sh" ]] && grep -q 'SUBJECT_DIR_OVERRIDE' "$RUNTIME_ROOT/legacy/construction/scripts/build_subject_package.sh"; } \
  || { [[ -f "$RUNTIME_ROOT/legacy/construction/scripts/verify_reproduction.sh" ]] && grep -q 'SUBJECT_DIR_OVERRIDE' "$RUNTIME_ROOT/legacy/construction/scripts/verify_reproduction.sh"; }; then
  export SUBJECT_DIR_OVERRIDE="$SUBJECT_DIR"
fi
CANDIDATE_OUTPUT_ROOT="$OUTPUT_DIR"
export SUBJECT_DIR OUTPUT_DIR="$RUN_ROOT" REPRO_VARIANT="$LEGACY_VARIANT" SUBJECT_VARIANT="$LEGACY_VARIANT"
set +e
ENGINE="${CONTAINER_ENGINE:-$(command -v docker >/dev/null 2>&1 && echo docker || echo docker)}"
LEGACY_RUN="$RUNTIME_ROOT/legacy/public/repro/scripts/run.sh"
if grep -Eq "(docker|docker)[[:space:]]+run" "$LEGACY_RUN" \
  || grep -q "^ENGINE=" "$LEGACY_RUN" \
  || { [[ -x "$RUNTIME_ROOT/legacy/construction/scripts/verify_reproduction.sh" ]] && grep -Eq "(docker|docker)[[:space:]]+run|^ENGINE=" "$RUNTIME_ROOT/legacy/construction/scripts/verify_reproduction.sh"; }; then
  if [[ -x "$RUNTIME_ROOT/legacy/construction/scripts/verify_reproduction.sh" ]]; then
    bash "$RUNTIME_ROOT/legacy/construction/scripts/verify_reproduction.sh" "$LEGACY_VARIANT"
  else
    bash "$LEGACY_RUN" "$LEGACY_VARIANT"
  fi
else
  NODE_MODULES_SOURCE=""
  if [[ -e "$SUBJECT_DIR/node_modules" ]]; then NODE_MODULES_SOURCE="$(readlink -f "$SUBJECT_DIR/node_modules")"; fi
  SUBJECT_RUNTIME="$RUN_ROOT/subject"
  mkdir -p "$SUBJECT_RUNTIME"
  tar --exclude=node_modules -C "$SUBJECT_DIR" -cf - . | tar -C "$SUBJECT_RUNTIME" -xf -
  # Candidate directories may be Git worktrees whose .git file points to a
  # host-only path. Recreate disposable metadata inside the container copy;
  # product files and the externally supplied patch remain unchanged.
  if [[ -f "$SUBJECT_RUNTIME/.git" ]]; then
    rm -f "$SUBJECT_RUNTIME/.git"
    git -C "$SUBJECT_RUNTIME" init -q
    git -C "$SUBJECT_RUNTIME" add -A
    git -C "$SUBJECT_RUNTIME" -c user.name=interactrepair -c user.email=interactrepair@localhost commit -qm candidate-subject
  fi
  MOUNTS=(-v "$SUBJECT_RUNTIME:/subject:rw" -v "$RUNTIME_ROOT:/runtime:rw" -v "$RUN_ROOT:/results:rw")
  if [[ -n "$NODE_MODULES_SOURCE" && -d "$NODE_MODULES_SOURCE" ]]; then MOUNTS+=(-v "$NODE_MODULES_SOURCE:/subject/node_modules:ro"); fi
  "$ENGINE" run --rm --user 0 --ipc=host \
    -e SUBJECT_DIR=/subject -e SUBJECT_DIR_OVERRIDE=/subject -e OUTPUT_DIR=/results -e REPO_ROOT=/runtime/repo-root -e REPRO_VARIANT="$LEGACY_VARIANT" -e SUBJECT_VARIANT="$LEGACY_VARIANT" \
    -e CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome \
    -e CHROMEDRIVER_EXECUTABLE=/usr/bin/chromedriver \
    "${MOUNTS[@]}" mcr.microsoft.com/playwright:v1.58.2-noble bash -lc \
    'if command -v corepack >/dev/null 2>&1 && ! command -v pnpm >/dev/null 2>&1; then corepack enable; fi; if [[ -x /runtime/legacy/construction/scripts/verify_reproduction.sh ]]; then bash /runtime/legacy/construction/scripts/verify_reproduction.sh "$REPRO_VARIANT"; else bash /runtime/legacy/public/repro/scripts/run.sh "$REPRO_VARIANT"; fi'
fi
RUN_EXIT=$?
set -e
OBSERVATION="$(find "$CANDIDATE_OUTPUT_ROOT" -type f -name observation.json -print -quit)"
if [[ -z "$OBSERVATION" ]]; then
  echo "legacy browser reproduction did not produce observation.json" >&2
  exit 1
fi
cp "$OBSERVATION" "$CANDIDATE_OUTPUT_ROOT/observation.json"
python3 - "$CANDIDATE_OUTPUT_ROOT/observation.json" "$MODE" "$RUN_EXIT" <<'PY2'
import json
import sys
from urllib.parse import urlsplit
path, mode, run_exit_text = sys.argv[1:]
run_exit = int(run_exit_text)
with open(path, encoding='utf-8') as observation_file:
    data = json.load(observation_file)
resource_404_urls = data.get('resource_404_urls')
favicon_404_valid = (
    isinstance(resource_404_urls, list)
    and all(isinstance(url, str) and urlsplit(url).path == '/favicon.ico'
            for url in resource_404_urls)
    and data.get('ignored_favicon_404') is bool(resource_404_urls)
)
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
elif 'pointer_tooltip_visible' in data:
    bug = data['pointer_tooltip_visible'] is False
elif 'committed' in data:
    bug = data['committed'] is False
elif 'listbox_visible_after_header_click' in data:
    bug = data['listbox_visible_after_header_click'] is False
elif 'reopenedValueChanged' in data:
    bug = bool(data['reopenedValueChanged'])
elif 'reopened_value_changed' in observed:
    bug = bool(observed['reopened_value_changed'])
elif 'open_after_scrollbar_click' in observed:
    bug = observed['open_after_scrollbar_click'] is False
elif observed.get('dialog') == 'closed' and observed.get('menu') == 'closed':
    bug = True
elif observed.get('mid_anchored_offset') is not None and observed.get('mid_no_anchor_offset') is not None:
    bug = observed['mid_anchored_offset'] != observed['mid_no_anchor_offset']
elif isinstance(observed.get('spacing'), str):
    bug = '/ 0' in observed['spacing'] or 'NaN' in observed['spacing']
else:
    bug = None
pre = data.get('precondition') or {}
post = data.get('postcondition') or {}
environment_valid = (
    run_exit == 0
    and data.get('mode') == ('gold' if mode == 'fixed' else mode)
    and isinstance(data.get('browser'), str) and 'Chrome/' in data['browser']
    and data.get('viewport') == {'width': 960, 'height': 600}
    and data.get('console_errors') == [] and favicon_404_valid
    and pre.get('dialog_open') is True and pre.get('combobox_open') is True
    and type(pre.get('input_focused_after_open')) is bool
    and isinstance(post.get('input_value'), str)
    and (post.get('active_test_id') is None or isinstance(post.get('active_test_id'), str))
    and data.get('action') == 'type Svelte into the portaled Combobox input'
    and bug is not None
)
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
with open(path, 'w', encoding='utf-8') as observation_file:
    json.dump(record, observation_file, indent=2)
print(json.dumps(record, indent=2))
expected = mode == 'buggy'
if not environment_valid or bug is not expected:
    raise SystemExit('legacy candidate-aware reproduction predicate mismatch')
PY2
