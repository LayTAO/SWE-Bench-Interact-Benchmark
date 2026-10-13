#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SOURCE="$(cd "$SCRIPT_DIR/../app" && pwd)"
TOOLING_SOURCE="$(cd "$SCRIPT_DIR/../tooling" && pwd)"
: "${SUBJECT_DIR:?SUBJECT_DIR must be a writable exact checkout with dependencies installed}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
: "${REPRO_VARIANT:?REPRO_VARIANT must be buggy, fixed or gold}"
: "${CHROMIUM_EXECUTABLE:?CHROMIUM_EXECUTABLE is required}"
case "$REPRO_VARIANT" in
  buggy) capture_mode=buggy ;;
  fixed|gold) capture_mode=gold ;;
  *) echo "invalid REPRO_VARIANT" >&2; exit 2 ;;
esac

BAZEL_OUTPUT_BASE="${BAZEL_OUTPUT_BASE:-$SUBJECT_DIR/node_modules/.cache/bazel-output}"
export BAZELISK_HOME="${BAZELISK_HOME:-$SUBJECT_DIR/node_modules/.cache/bazelisk}"
RESULTS_DIR="$OUTPUT_DIR/results"
mkdir -p "$RESULTS_DIR"

if git -C "$SUBJECT_DIR" apply --check "$APP_SOURCE/fixture.patch" >/dev/null 2>&1; then
  git -C "$SUBJECT_DIR" apply "$APP_SOURCE/fixture.patch"
elif ! git -C "$SUBJECT_DIR" apply --reverse --check "$APP_SOURCE/fixture.patch" >/dev/null 2>&1; then
  git -C "$SUBJECT_DIR" apply --3way "$APP_SOURCE/fixture.patch" || {
    echo "Angular reproduction fixture is neither applicable nor already applied" >&2
    exit 2
  }
fi

cd "$SUBJECT_DIR"
if [[ -d "$BAZEL_OUTPUT_BASE" ]]; then
  chmod -R u+w "$BAZEL_OUTPUT_BASE" 2>/dev/null || true
fi
yarn --ignore-engines -s bazel \
  --host_jvm_args=-Xmx1200m \
  --output_base="$BAZEL_OUTPUT_BASE" \
  run --jobs=1 --local_cpu_resources=1 --local_ram_resources=3072 \
  --worker_max_instances=1 \
  //src/dev-app:interactrepair-25077-devserver \
  >"$RESULTS_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT

STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-900}"
REPRO_URL="${REPRO_URL:-http://127.0.0.1:4200/interactrepair-25077-index.html}"
for _ in $(seq 1 "$STARTUP_TIMEOUT_SECONDS"); do
  if curl -fsS "$REPRO_URL" >/dev/null 2>&1; then break; fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    tail -200 "$RESULTS_DIR/server.log" >&2 || true
    exit 1
  fi
  sleep 1
done
curl -fsS "$REPRO_URL" >/dev/null

NODE_PATH="$SUBJECT_DIR/node_modules" \
CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" \
/usr/bin/node "$TOOLING_SOURCE/capture.cjs" "$capture_mode" "$RESULTS_DIR" "$REPRO_URL"
test -s "$RESULTS_DIR/$capture_mode-screenshot.png"
test -s "$RESULTS_DIR/observation.json"
