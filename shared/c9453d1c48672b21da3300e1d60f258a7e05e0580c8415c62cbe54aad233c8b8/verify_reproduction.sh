#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MODE="${1:-}"
case "$MODE" in buggy|gold) ;; *) echo "usage: $0 buggy|gold" >&2; exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
: "${CHROMIUM_EXECUTABLE:?CHROMIUM_EXECUTABLE must point to Chromium 145.0.7632.6}"
OUTPUT_DIR="${OUTPUT_DIR:-$SAMPLE_ROOT/../../runs/adobe__react-spectrum-8291/reproduction-$MODE}"
SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_DIR="$OUTPUT_DIR" REPRO_VARIANT="$MODE" CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" \
  bash "$SAMPLE_ROOT/public/repro/scripts/run.sh"
python3 - "$OUTPUT_DIR/results/observation.json" "$MODE" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
passed=data.get("oracle_passed",data.get("oracle",{}).get("passed"))
expected=sys.argv[2] == "gold"
if passed is not expected:
    raise SystemExit(f"oracle mismatch: expected {expected}, got {passed}")
PY
