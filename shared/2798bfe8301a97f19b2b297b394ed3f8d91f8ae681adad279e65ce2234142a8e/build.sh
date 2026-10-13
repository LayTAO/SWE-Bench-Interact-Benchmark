#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?prepared candidate source is required}"
: "${OUTPUT_DIR:?output directory is required}"
APP="$SUBJECT_DIR/packages/react/.harbor-canonical-repro"
mkdir -p "$APP" "$OUTPUT_DIR"
cp -a /tests/canonical_repro/app/. "$APP/"
cd "$SUBJECT_DIR"
node_modules/.bin/vite build --config "$APP/vite.config.mjs" >"$OUTPUT_DIR/build.log" 2>&1
sha256sum packages/react/src/components/FloatingFocusManager.tsx >"$OUTPUT_DIR/subject-source.sha256"
sha256sum "$APP"/dist/assets/*.js >"$OUTPUT_DIR/browser-bundle.sha256"
