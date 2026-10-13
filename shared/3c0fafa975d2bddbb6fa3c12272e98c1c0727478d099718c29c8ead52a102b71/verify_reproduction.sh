#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MODE="${1:-}"
case "$MODE" in
  buggy|gold) ;;
  *) echo "usage: $0 buggy|gold" >&2; exit 2 ;;
esac

: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
OUTPUT_DIR="${OUTPUT_DIR:-$SAMPLE_ROOT/../../runs/ariakit__ariakit-4825/reproduction-$MODE}"
SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_DIR="$OUTPUT_DIR" REPRO_VARIANT="$MODE" \
  bash "$SAMPLE_ROOT/public/repro/scripts/run.sh"

python3 - "$OUTPUT_DIR/${MODE}.playwright.json" "$MODE" <<'PY'
import json
import sys

data = json.load(open(sys.argv[1]))
passed = data.get("stats", {}).get("unexpected", 0) == 0
expected = sys.argv[2] == "gold"
if passed is not expected:
    raise SystemExit(f"oracle mismatch: expected test pass={expected}, got {passed}")
PY
