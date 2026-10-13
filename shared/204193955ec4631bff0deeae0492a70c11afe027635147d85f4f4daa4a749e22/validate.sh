#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$MODE" in buggy|fixed|patched) ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
CANONICAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="${CONTAINER_ENGINE:-$(command -v podman >/dev/null 2>&1 && echo podman || echo docker)}"
TOOLING_DIR="$OUTPUT_DIR/tooling"
mkdir -p "$TOOLING_DIR"
cp "$CANONICAL_ROOT/tooling/package.json" "$TOOLING_DIR/package.json"
if [[ -f "$CANONICAL_ROOT/tooling/package-lock.json" ]]; then cp "$CANONICAL_ROOT/tooling/package-lock.json" "$TOOLING_DIR/package-lock.json"; fi
"$ENGINE" run --rm --ipc=host \
  -e MODE="$MODE" \
  -e OUTPUT_DIR=/results \
  -v "$SUBJECT_DIR:/subject:ro" \
  -v "$CANONICAL_ROOT:/oracle:ro" \
  -v "$TOOLING_DIR:/tooling:rw" \
  -v "$OUTPUT_DIR:/results:rw" \
  mcr.microsoft.com/playwright:v1.58.2-noble bash -lc 'cd /tooling && npm install --no-audit --no-fund --ignore-scripts && bash /oracle/scripts/container.sh "$MODE"'
python3 - "$OUTPUT_DIR/observation.json" "$MODE" <<'PY2'
import json, sys
data=json.load(open(sys.argv[1], encoding='utf-8'))
expected=sys.argv[2] == 'buggy'
if data.get('mode') != sys.argv[2] or data.get('environment_valid') is not True or data.get('trigger_valid') is not True or data.get('bug_observed') is not expected:
    raise SystemExit('Adobe canonical predicate mismatch')
PY2
