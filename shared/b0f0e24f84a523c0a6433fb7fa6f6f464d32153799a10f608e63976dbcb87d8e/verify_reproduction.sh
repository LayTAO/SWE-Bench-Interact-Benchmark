#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MODE="${1:-}"
case "$MODE" in buggy|gold) ;; *) echo "usage: $0 buggy|gold" >&2; exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
OUTPUT_DIR="${OUTPUT_DIR:-$SAMPLE_ROOT/../../runs/heroui-inc__heroui-3276/reproduction-$MODE}"
SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_DIR="$OUTPUT_DIR" REPRO_VARIANT="$MODE" bash "$SAMPLE_ROOT/public/repro/scripts/run.sh"
python3 - "$OUTPUT_DIR/results/observation.json" "$MODE" <<'PY'
import json,sys
data=json.load(open(sys.argv[1]))
expected=sys.argv[2] == "gold"
if data.get("chromium_version") != "145.0.7632.6": raise SystemExit("unexpected Chromium version")
if data.get("workers") != 1 or data.get("retries") != 0: raise SystemExit("unexpected browser concurrency")
if data.get("oracle_passed") is not expected: raise SystemExit(f"oracle mismatch: expected {expected}, got {data.get('oracle_passed')}")
PY
