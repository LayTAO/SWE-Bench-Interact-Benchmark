#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPRO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODE="${1:-}"
case "$MODE" in
  buggy) expected_bug=true ;;
  fixed|patched) expected_bug=false ;;
  *) echo "usage: $0 buggy|fixed|patched" >&2; exit 2 ;;
esac

: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
ENGINE="${CONTAINER_ENGINE:-/usr/local/bin/docker}"
IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.58.2-noble}"
ATTEMPT="${ATTEMPT:-1}"
RUN_TOKEN="${RUN_TOKEN:-ir-i-051}"
safe_token="$(printf '%s' "$RUN_TOKEN-$MODE-$ATTEMPT" | tr -cd 'a-zA-Z0-9_.-')"
container_name="interactrepair-${safe_token}"
STATE_CACHE_DIR="${STATE_CACHE_DIR:-${OUTPUT_DIR}/state-cache}"
TOOLING_CACHE_ROOT="${TOOLING_CACHE_ROOT:-${STATE_CACHE_DIR}/tooling-cache}"
tooling_inputs=("$REPRO_ROOT/tooling/package.json")
if [[ -f "$REPRO_ROOT/tooling/package-lock.json" ]]; then
  tooling_inputs+=("$REPRO_ROOT/tooling/package-lock.json")
fi
tooling_hash="$(sha256sum "${tooling_inputs[@]}" | sha256sum | cut -d' ' -f1)"
tooling_dir="$TOOLING_CACHE_ROOT/tooling-$tooling_hash"

mkdir -p "$OUTPUT_DIR" "$STATE_CACHE_DIR" "$TOOLING_CACHE_ROOT"
if [[ -f "$tooling_dir/.interactrepair-ready" ]]; then
  cmp "$REPRO_ROOT/tooling/package.json" "$tooling_dir/package.json"
  cmp "$REPRO_ROOT/tooling/package-lock.json" "$tooling_dir/package-lock.json"
  tooling_mount="$tooling_dir:/tooling:ro"
else
  mkdir -p "$tooling_dir"
  cp "$REPRO_ROOT/tooling/package.json" "$tooling_dir/package.json"
  if [[ -f "$REPRO_ROOT/tooling/package-lock.json" ]]; then
    cp "$REPRO_ROOT/tooling/package-lock.json" "$tooling_dir/package-lock.json"
  fi
  tooling_mount="$tooling_dir:/tooling"
fi

cleanup() {
  "$ENGINE" rm -f "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT HUP INT TERM

timeout 240 "$ENGINE" run --rm --name "$container_name" --ipc=host \
  -e EXPECT_BUG="$expected_bug" \
  -e REPRO_MODE="$MODE" \
  -v "$SUBJECT_DIR:/subject:ro" \
  -v "$REPRO_ROOT:/oracle:ro" \
  -v "$tooling_mount" \
  -v "$OUTPUT_DIR:/results" \
  -v "$STATE_CACHE_DIR:/state-cache" \
  "$IMAGE" bash /oracle/scripts/container.sh

python3 - "$OUTPUT_DIR/observation.json" "$MODE" "$expected_bug" <<'PY'
import json
import sys

path, mode, expected_text = sys.argv[1:]
data = json.load(open(path, encoding="utf-8"))
expected = expected_text == "true"
checks = {
    "mode": data.get("mode") == mode,
    "browser": data.get("browser_version") == "145.0.7632.6",
    "workers": data.get("workers") == 1,
    "retries": data.get("retries") == 0,
    "environment": data.get("environment_valid") is True,
    "trigger": data.get("trigger_valid") is True,
    "no_action_error": data.get("action_error") is None,
    "predicate": data.get("bug_observed") is expected,
}
failed = [name for name, passed in checks.items() if not passed]
if failed:
    raise SystemExit("canonical reproduction validation failed: " + ", ".join(failed))
PY
