#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?prepared candidate source is required}"
: "${OUTPUT_DIR:?output directory is required}"
APP="$SUBJECT_DIR/.harbor-canonical-repro"
mkdir -p "$APP" "$OUTPUT_DIR"
cp -a /tests/canonical_repro/app/. "$APP/"
# Use the upstream-frozen Vite and Sass; browser test tooling is verifier-only.
ln -sfn /opt/canonical-tooling/node_modules "$APP/node_modules"
export NODE_PATH="$SUBJECT_DIR/packages/theme-chalk/node_modules"
cd "$SUBJECT_DIR"
play/node_modules/.bin/vite build --config "$APP/vite.config.mjs" >"$OUTPUT_DIR/build.log" 2>&1
sha256sum packages/components/date-picker-panel/src/date-picker-com/panel-date-range.vue >"$OUTPUT_DIR/subject-source.sha256"
sha256sum "$APP"/dist/assets/*.js >"$OUTPUT_DIR/browser-bundle.sha256"
