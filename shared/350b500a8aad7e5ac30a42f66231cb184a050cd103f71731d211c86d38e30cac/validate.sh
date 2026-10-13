#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPRO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MODE="${1:-}"
case "$MODE" in buggy) expected_bug=true ;; fixed|patched) expected_bug=false ;; *) echo "usage: $0 buggy|fixed|patched" >&2; exit 2 ;; esac
: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
mkdir -p "$OUTPUT_DIR/site"
cp "$REPRO_ROOT/app/index.html" "$OUTPUT_DIR/site/index.html"
ln -s "$SUBJECT_DIR/packages/webawesome/dist-cdn" "$OUTPUT_DIR/site/dist-cdn"
python3 -m http.server 4173 --bind 127.0.0.1 --directory "$OUTPUT_DIR/site" >"$OUTPUT_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
for _ in $(seq 1 60); do curl -fsS http://127.0.0.1:4173/ >/dev/null 2>&1 && break; sleep 1; done
EXPECT_BUG="$expected_bug" REPRO_MODE="$MODE" BASE_URL=http://127.0.0.1:4173 \
  npx --yes playwright test --config="$REPRO_ROOT/playwright/playwright.config.ts"
