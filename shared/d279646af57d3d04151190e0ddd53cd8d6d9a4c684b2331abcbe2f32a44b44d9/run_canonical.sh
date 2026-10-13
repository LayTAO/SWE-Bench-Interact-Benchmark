#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?buggy or fixed}"
SUBJECT_DIR="${2:?subject directory}"
OUTPUT_DIR="${3:?output directory}"
CANONICAL_ROOT=/tests/canonical_repro
CANONICAL_SUBJECT_PATH=''
mkdir -p "$OUTPUT_DIR" "$OUTPUT_DIR/results" /state-cache
ln -sfn "$CANONICAL_ROOT" /oracle
ln -sfn "$SUBJECT_DIR" /subject
ln -sfn "$OUTPUT_DIR" /results
export SUBJECT_DIR OUTPUT_DIR REPRO_MODE="$MODE" REPRO_VARIANT="$MODE"
if [[ "$MODE" == buggy ]]; then EXPECT_BUG=true; else EXPECT_BUG=false; fi
export EXPECT_BUG
CHROMIUM_EXECUTABLE="$(find /ms-playwright -type f -path '*/chrome-linux64/chrome' -print -quit 2>/dev/null || true)"
if [[ -z "$CHROMIUM_EXECUTABLE" ]]; then
  CHROMIUM_EXECUTABLE=/ms-playwright/chromium-1208/chrome-linux64/chrome
fi
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
if [[ -x "$CANONICAL_ROOT/scripts/validate.sh" ]]; then
  # validate.sh owns the oracle staging layout and must run before any
  # lower-level container runner.  Calling container.sh directly leaves its
  # /oracle paths pointed at the canonical source tree instead of the staged
  # oracle application.
  bash "$CANONICAL_ROOT/scripts/validate.sh" "$MODE" >"$OUTPUT_DIR/canonical.log" 2>&1
elif [[ -x "$CANONICAL_ROOT/scripts/container.sh" ]]; then
  # Some accepted container runners were originally invoked with these
  # bind-mount names by validate.sh.  Recreate the same names when the
  # verifier executes the runner directly, without exposing verifier files to
  # the Agent image.
  rm -rf /oracle-src /tooling
  ln -sfn "$CANONICAL_ROOT/app" /oracle-src
  ln -sfn "$CANONICAL_ROOT/tooling" /tooling
  bash "$CANONICAL_ROOT/scripts/container.sh" "$MODE" >"$OUTPUT_DIR/canonical.log" 2>&1
else
  echo "canonical verifier has neither validate.sh nor container.sh" >&2
  exit 2
fi
