#!/usr/bin/env bash
set -euo pipefail

: "${SUBJECT_DIR:?SUBJECT_DIR must point to the prepared exact subject state}"
OUTPUT_DIR="${OUTPUT_DIR:-$(pwd)/runs/ariakit__ariakit-4825/reproduction}"
VARIANT="${REPRO_VARIANT:-buggy}"
mkdir -p "$OUTPUT_DIR"

cd "$SUBJECT_DIR"
OFFICIAL_TEST_PATCH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../hidden/patches" && pwd)/official_test.patch"
if git apply --check "$OFFICIAL_TEST_PATCH" >/dev/null 2>&1; then
  git apply "$OFFICIAL_TEST_PATCH"
elif ! git apply --reverse --check "$OFFICIAL_TEST_PATCH" >/dev/null 2>&1; then
  echo "official test patch cannot be applied to the candidate subject" >&2
  exit 1
fi
# The verifier image is built from the same base checkout with its frozen
# dependencies already installed. Reusing that tree keeps this canonical
# reproduction deterministic under the verifier's --network=none policy.
if [[ ! -f node_modules/.modules.yaml ]]; then
  pnpm install --frozen-lockfile --ignore-scripts --offline
fi
pnpm --filter site build-min
cd site

export PLAYWRIGHT_JSON_OUTPUT_NAME="$OUTPUT_DIR/${VARIANT}.playwright.json"
set +e
pnpm test-chrome src/sandbox/4825-dialog-combobox/test-browser.ts \
  --workers=1 \
  --retries=0 \
  --reporter=json \
  --trace=on \
  --output="$OUTPUT_DIR/artifacts"
TEST_EXIT=$?
set -e

OUTPUT_DIR="$OUTPUT_DIR" VARIANT="$VARIANT" TEST_EXIT="$TEST_EXIT" python3 - <<'PY'
import json
import os
from pathlib import Path

out = Path(os.environ["OUTPUT_DIR"])
report = json.loads((out / f"{os.environ['VARIANT']}.playwright.json").read_text())
unexpected = int((report.get("stats") or {}).get("unexpected", 0))
test_exit = int(os.environ["TEST_EXIT"])
observation = {
    "schema_version": "1.0",
    "variant": os.environ["VARIANT"],
    "test_exit_code": int(os.environ["TEST_EXIT"]),
    "unexpected": unexpected,
    "oracle_passed": test_exit == 0 and unexpected == 0,
    "console_errors": [],
}
(out / "observation.json").write_text(json.dumps(observation, indent=2) + "\n")
print(json.dumps(observation, indent=2))
PY
