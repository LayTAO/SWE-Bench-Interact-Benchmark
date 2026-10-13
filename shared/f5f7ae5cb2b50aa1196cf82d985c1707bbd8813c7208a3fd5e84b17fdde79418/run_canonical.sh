#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?buggy or fixed}"
SUBJECT_DIR="${2:?subject directory}"
OUTPUT_DIR="${3:?output directory}"
CANONICAL_ROOT=/tests/canonical_repro
CANONICAL_SUBJECT_PATH=''
mkdir -p "$OUTPUT_DIR" "$OUTPUT_DIR/results" /state-cache
ln -sfn "$CANONICAL_ROOT" /oracle
if [[ "$SUBJECT_DIR" != /subject ]]; then ln -sfn "$SUBJECT_DIR" /subject; fi
ln -sfn "$OUTPUT_DIR" /results
export SUBJECT_DIR OUTPUT_DIR REPRO_MODE="$MODE" REPRO_VARIANT="$MODE"
if [[ "$MODE" == buggy ]]; then EXPECT_BUG=true; else EXPECT_BUG=false; fi
export EXPECT_BUG
CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f \( -path '*/chrome-linux64/chrome' -o -path '*/chrome-linux/chrome' -o -path '*/chrome-headless-shell-linux64/chrome-headless-shell' \) -print -quit 2>/dev/null || true)"
if [[ -z "$CHROMIUM_EXECUTABLE" ]]; then
  CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -name chrome -path '*/chromium-*/*' -print -quit 2>/dev/null || true)"
fi
[[ -n "$CHROMIUM_EXECUTABLE" ]] || { echo 'Chromium executable was not found under /ms-playwright' >&2; exit 125; }
export CHROMIUM_EXECUTABLE CHROME_BIN="$CHROMIUM_EXECUTABLE"
export CONTAINER_ENGINE=/usr/local/bin/docker
if [[ -n "$CANONICAL_SUBJECT_PATH" ]]; then
  package_dir="$SUBJECT_DIR/$CANONICAL_SUBJECT_PATH"
  [[ -d "$package_dir" ]] || { echo "canonical subject package is missing: $package_dir" >&2; exit 2; }
  find /state-cache -maxdepth 1 -type f -name '*.tgz' -delete
  (cd "$package_dir" && npm pack --pack-destination /state-cache > /state-cache/subject-artifact.pack.log 2>&1)
  SUBJECT_ARTIFACT="$(find /state-cache -maxdepth 1 -type f -name '*.tgz' -print | head -n 1)"
  [[ -n "$SUBJECT_ARTIFACT" ]] || { echo "npm pack did not produce SUBJECT_ARTIFACT" >&2; exit 2; }
  export SUBJECT_ARTIFACT
fi
if [[ -d "$CANONICAL_ROOT/legacy/public/repro/tooling/node_modules" ]]; then
  export TOOLING_CACHE="$CANONICAL_ROOT/legacy/public/repro/tooling"
fi
if [[ -d "$CANONICAL_ROOT/tooling/node_modules" ]]; then
  export TOOLING_CACHE_DIR="$CANONICAL_ROOT/tooling"
fi
# validate.sh owns the original mounts, preparation and health/trigger guards.
# Calling container.sh directly omits those Accepted checks and mappings.
bash "$CANONICAL_ROOT/scripts/validate.sh" "$MODE" >"$OUTPUT_DIR/canonical.log" 2>&1
