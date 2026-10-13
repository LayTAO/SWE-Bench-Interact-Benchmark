#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: verify_reproduction.sh <buggy|gold>}"
case "$MODE" in buggy) variant=buggy ;; gold) variant=fixed ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../public/repro/scripts" && pwd)"
REPRO_VARIANT="$variant" SUBJECT_DIR="$SUBJECT_DIR" OUTPUT_DIR="$OUTPUT_DIR" bash "$SCRIPT_DIR/run.sh"
python3 - "$OUTPUT_DIR/observation.json" "$variant" <<'PY'
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
expected = sys.argv[2] == "fixed"
if d.get("environment_valid") is not True or d.get("trigger_valid") is not True:
    raise SystemExit("canonical environment or trigger gate failed")
if d.get("oracle_passed") is not expected:
    raise SystemExit(f"oracle mismatch: expected {expected}, got {d.get('oracle_passed')}")
PY
