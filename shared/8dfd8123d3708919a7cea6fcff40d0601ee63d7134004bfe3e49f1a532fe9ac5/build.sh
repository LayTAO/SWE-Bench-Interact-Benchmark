#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?prepared candidate source is required}"
: "${OUTPUT_DIR:?output directory is required}"
ROOT=/tests/canonical_repro
APP="$SUBJECT_DIR/.harbor-canonical-repro"
mkdir -p "$APP" "$OUTPUT_DIR"
cp -a "$ROOT/app/." "$APP/"
cd "$SUBJECT_DIR"
node_modules/.bin/svelte-kit sync >"$OUTPUT_DIR/source-prepare.log" 2>&1
node_modules/.bin/vite build --config "$APP/vite.config.mjs" >"$OUTPUT_DIR/build.log" 2>&1
find src/lib -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum >"$OUTPUT_DIR/subject-source.sha256"
sha256sum "$APP"/dist/assets/*.js >"$OUTPUT_DIR/browser-bundle.sha256"
