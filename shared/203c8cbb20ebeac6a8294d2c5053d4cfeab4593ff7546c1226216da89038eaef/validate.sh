#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh buggy|fixed|patched}"; case "$MODE" in buggy|fixed|patched) ;; *) exit 2 ;; esac
: "${SUBJECT_DIR:?prepared candidate source is required}"; : "${OUTPUT_DIR:?output directory is required}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; APP="$SUBJECT_DIR/.harbor-canonical-repro"
rm -rf "$APP"; mkdir -p "$APP" "$OUTPUT_DIR"; cp -a "$ROOT/app/." "$APP/"; ln -sfn /opt/canonical-tooling/node_modules "$APP/node_modules"
export REPRO_MODE="$MODE" SUBJECT_DIR OUTPUT_DIR CHROMIUM_EXECUTABLE="${CHROMIUM_EXECUTABLE:-$(find /ms-playwright -type f -path '*/chrome-linux*/chrome' -print -quit)}"; [[ -x "$CHROMIUM_EXECUTABLE" ]]
/opt/canonical-tooling/node_modules/.bin/vite build --config "$APP/vite.config.mjs" >"$OUTPUT_DIR/build.log" 2>&1
/opt/canonical-tooling/node_modules/.bin/vite preview --config "$APP/vite.config.mjs" >"$OUTPUT_DIR/server.log" 2>&1 & pid=$!
trap 'kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 60); do curl -fsS http://127.0.0.1:4173/ >/dev/null && break; sleep 1; done; curl -fsS http://127.0.0.1:4173/ >/dev/null
/opt/canonical-tooling/node_modules/.bin/playwright test --config "$APP/playwright.config.cjs"
node /tests/verifier/check-canonical.cjs "$OUTPUT_DIR" "$MODE"
