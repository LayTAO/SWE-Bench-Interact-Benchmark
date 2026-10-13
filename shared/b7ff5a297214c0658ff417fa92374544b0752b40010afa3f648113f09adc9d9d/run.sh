#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
: "${REPRO_VARIANT:?REPRO_VARIANT is required}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPRO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ORACLE_DIR="$OUTPUT_DIR/oracle"
RESULTS_DIR="$OUTPUT_DIR/results"
mkdir -p "$ORACLE_DIR" "$RESULTS_DIR"
cp -R "$REPRO_ROOT/app/." "$ORACLE_DIR/"
cp "$REPRO_ROOT/app/scenario.spec.ts" "$ORACLE_DIR/scenario.spec.ts"
if [[ -n "${ORACLE_CACHE:-}" && -d "${ORACLE_CACHE}/node_modules" ]]; then cp -a "$ORACLE_CACHE/node_modules" "$ORACLE_DIR/"; fi
rm -rf /oracle
mkdir -p "$ORACLE_DIR" "$RESULTS_DIR"
ln -s "$ORACLE_DIR" /oracle
REPRO_VARIANT="$REPRO_VARIANT" bash "$SCRIPT_DIR/container.sh"
