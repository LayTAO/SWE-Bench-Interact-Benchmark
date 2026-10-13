#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MODE="${1:-}"
case "$MODE" in buggy|fixed|gold) ;; *) echo "usage: $0 buggy|fixed|gold" >&2; exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
: "${CHROMIUM_EXECUTABLE:?CHROMIUM_EXECUTABLE must point to Chromium 120.0.6099.224}"
: "${CHROMEDRIVER_EXECUTABLE:?CHROMEDRIVER_EXECUTABLE must match Chromium}"
OUTPUT_DIR="${OUTPUT_DIR:-$SAMPLE_ROOT/../../runs/angular__components-25077/reproduction-$MODE}"
SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_DIR="$OUTPUT_DIR" REPRO_VARIANT="$MODE" \
CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" CHROMEDRIVER_EXECUTABLE="$CHROMEDRIVER_EXECUTABLE" \
  bash "$SAMPLE_ROOT/public/repro/scripts/run.sh"
python3 - "$OUTPUT_DIR/results/observation.json" "$MODE" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
passed=data.get("oracle",{}).get("passed")
expected=sys.argv[2] in {"fixed", "gold"}
if passed is not expected:
    raise SystemExit(f"oracle mismatch: expected {expected}, got {passed}")
PY
