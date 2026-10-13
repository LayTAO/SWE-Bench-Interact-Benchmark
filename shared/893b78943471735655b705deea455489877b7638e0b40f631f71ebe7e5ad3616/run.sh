#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_SOURCE="$(cd "$SCRIPT_DIR/../app" && pwd)"
TOOLING_SOURCE="$(cd "$SCRIPT_DIR/../tooling" && pwd)"
: "${SUBJECT_DIR:?SUBJECT_DIR must be a writable exact checkout with dependencies installed}"
: "${OUTPUT_DIR:?OUTPUT_DIR is required}"
: "${REPRO_VARIANT:?REPRO_VARIANT must be buggy or gold}"
: "${CHROMIUM_EXECUTABLE:?CHROMIUM_EXECUTABLE must point to Chromium 145.0.7632.6}"
case "$REPRO_VARIANT" in buggy|gold) ;; *) echo "invalid REPRO_VARIANT" >&2; exit 2 ;; esac
# The frozen website imports next/font/google, whose development compiler
# fetches Google Fonts.  The verifier is intentionally no-network, so remove
# only that presentation-only dependency from the disposable subject copy.
python3 - "$SUBJECT_DIR/website/app/layout.tsx" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
if path.is_file():
    text = path.read_text(encoding="utf-8")
    text = text.replace('import { Inter } from "next/font/google";\n', "")
    text = text.replace('\nconst inter = Inter({ subsets: ["latin"] });\n', "\n")
    text = text.replace(' className={inter.className}', "")
    text = text.replace('import { Analytics } from "@vercel/analytics/react";\n', "")
    text = text.replace('        <Analytics />\n', "")
    path.write_text(text, encoding="utf-8")
PY
python3 - "$SUBJECT_DIR/website/components/header.tsx" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
if path.is_file():
    text = path.read_text(encoding="utf-8")
    replacement = '''async function fetchVersions() {
  // The canonical preview does not depend on the release selector.  Keep
  // this disposable fixture offline instead of fetching npm registry tags.
  const versions = {"@ariakit/react": {latest: "0.0.0"}};
  cache = versions;
  return versions;
}

export async function Header'''
    text, count = re.subn(
        r"function fetchPackage\(.*?\n\}\n\nasync function fetchVersions\(\) \{.*?\n\}\n\nexport async function Header",
        replacement,
        text,
        count=1,
        flags=re.S,
    )
    if count != 1:
        raise SystemExit("failed to replace the networked Header version loader")
    if "registry.npmjs.org" in text or "fetchPackage(" in text:
        raise SystemExit("networked Header version loader remains in canonical subject")
    path.write_text(text, encoding="utf-8")
PY
OFFICIAL_TEST_PATCH="$SCRIPT_DIR/../../../hidden/patches/official_test.patch"
# The reproduction page is introduced by the official test patch, so the
# disposable subject needs that fixture in both Buggy/NOP and Gold/Oracle
# variants.  The patch is not exposed to the Agent image.
if git -C "$SUBJECT_DIR" apply --check "$OFFICIAL_TEST_PATCH" >/dev/null 2>&1; then
  git -C "$SUBJECT_DIR" apply "$OFFICIAL_TEST_PATCH"
elif ! git -C "$SUBJECT_DIR" apply --reverse --check "$OFFICIAL_TEST_PATCH" >/dev/null 2>&1; then
  echo "official test patch cannot be applied to the canonical subject" >&2
  exit 1
fi
[[ -f "$SUBJECT_DIR/examples/select-menu-default-open/index.tsx" ]] || {
  echo "canonical fixture was not materialized in the subject checkout" >&2
  exit 23
}
RESULTS_DIR="$OUTPUT_DIR/results"
TOOLING_DIR="$TOOLING_SOURCE"
mkdir -p "$RESULTS_DIR"
[[ -x "$TOOLING_DIR/node_modules/.bin/playwright" ]] || {
  echo "pinned Playwright tooling is missing from the Verifier image" >&2
  exit 21
}
# The verifier is no-network.  Do not let inherited proxy settings redirect
# Next development/telemetry requests to a stale local proxy port.
export NEXT_TELEMETRY_DISABLED=1
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
export NET_TRACE_FILE="$RESULTS_DIR/net-trace.jsonl"
export NODE_OPTIONS="${NODE_OPTIONS:-} --require=$TOOLING_DIR/net-trace.cjs"
:
cd "$SUBJECT_DIR"
if ! npm run build --prefix website >"$RESULTS_DIR/build.log" 2>&1; then
  echo "legacy Next production build failed" >&2
  exit 24
fi
npm run start --prefix website -- --hostname 127.0.0.1 --port 3000 >"$RESULTS_DIR/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
ready=false
for attempt in $(seq 1 300); do
  if (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
    exec 3>&-
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo "legacy Next server did not open port 3000" >&2
  exit 22
fi
CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" node "$TOOLING_DIR/capture.mjs" IR-M-057 "$REPRO_VARIANT" "http://127.0.0.1:3000" "$RESULTS_DIR"
