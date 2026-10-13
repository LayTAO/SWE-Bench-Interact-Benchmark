#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?usage: validate.sh <buggy|fixed|patched>}"
case "$MODE" in buggy) expected_bug=true ;; fixed|patched) expected_bug=false ;; *) exit 2 ;; esac
: "${SUBJECT_ARTIFACT:?SUBJECT_ARTIFACT must point to the exact prepared @react-aria/combobox package}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
REPRO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="${CONTAINER_ENGINE:-/usr/local/bin/docker}"
IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.58.2-noble}"
STATE_CACHE_DIR="${STATE_CACHE_DIR:-${OUTPUT_DIR}/state-cache}"
mkdir -p "$OUTPUT_DIR" "$STATE_CACHE_DIR"
TOOLING_RUNTIME_DIR="${TOOLING_RUNTIME_DIR:-${STATE_CACHE_DIR}/tooling-runtime}"
mkdir -p "$TOOLING_RUNTIME_DIR"
cp -R "$REPRO_ROOT/tooling/." "$TOOLING_RUNTIME_DIR/"
NODE_OPTIONS_VALUE="${NODE_OPTIONS:---dns-result-order=ipv4first}"
safe_token="ir-i-124-${MODE}-${ATTEMPT:-1}"
container_name="interactrepair-${safe_token}"
cleanup() { "$ENGINE" rm -f "$container_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT HUP INT TERM
# The in-process Docker adapter applies mounts in order.  Mount the state cache
# before the artifact whose source lives inside it, otherwise the later
# /state-cache mount can hide the artifact source and canonical repro fails.
"$ENGINE" run --rm --name "$container_name" --ipc=host -e EXPECT_BUG="$expected_bug" -e REPRO_MODE="$MODE" -e NODE_OPTIONS="$NODE_OPTIONS_VALUE" -e npm_config_cache=/state-cache/npm-cache -v "$REPRO_ROOT:/oracle:ro" -v "$OUTPUT_DIR:/results" -v "$STATE_CACHE_DIR:/state-cache" -v "$SUBJECT_ARTIFACT:/subject-artifact:ro" -v "$TOOLING_RUNTIME_DIR:/tooling" "$IMAGE" bash /oracle/scripts/container.sh
"$REPRO_ROOT/scripts/check_observation.py" "$OUTPUT_DIR/observation.json" "$MODE" "$expected_bug"
