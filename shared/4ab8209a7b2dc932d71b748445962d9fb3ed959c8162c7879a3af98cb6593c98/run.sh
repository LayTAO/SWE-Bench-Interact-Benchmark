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
# The frozen website contains presentation-only network dependencies.  The
# canonical verifier is offline, so remove them from the disposable subject
# checkout before starting Next; this does not alter the dialog behavior under
# test.
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
if git -C "$SUBJECT_DIR" apply --check "$OFFICIAL_TEST_PATCH" >/dev/null 2>&1; then
  git -C "$SUBJECT_DIR" apply "$OFFICIAL_TEST_PATCH"
elif ! git -C "$SUBJECT_DIR" apply --reverse --check "$OFFICIAL_TEST_PATCH" >/dev/null 2>&1; then
  echo "official test patch cannot be applied to the canonical subject" >&2
  exit 1
fi
RESULTS_DIR="$OUTPUT_DIR/results"
TOOLING_DIR="$OUTPUT_DIR/tooling"
mkdir -p "$RESULTS_DIR" "$TOOLING_DIR"
cp "$TOOLING_SOURCE/package.json" "$TOOLING_SOURCE/capture.mjs" "$TOOLING_SOURCE/net-trace.cjs" "$TOOLING_DIR/"
if [[ ! -d "$TOOLING_DIR/node_modules/playwright" ]]; then
  if [[ -d "$TOOLING_SOURCE/node_modules/playwright" ]]; then
    cp -a "$TOOLING_SOURCE/node_modules" "$TOOLING_DIR/"
  else
    npm install --prefix "$TOOLING_DIR" --no-audit --no-fund
  fi
fi
:
cd "$SUBJECT_DIR"
CANONICAL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export NEXT_FONT_GOOGLE_MOCKED_RESPONSES="$CANONICAL_ROOT/google-font-mocked-responses.cjs"
# The Harbor verifier is intentionally offline.  Do not let the disposable
# Next server inherit the host-side proxy used by the task runner; that proxy
# points at a per-run localhost port and makes canonical rendering fail.
export NEXT_TELEMETRY_DISABLED=1
unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
export NET_TRACE_FILE="$RESULTS_DIR/net-trace.jsonl"
export NODE_OPTIONS="${NODE_OPTIONS:-} --require=$TOOLING_DIR/net-trace.cjs"
npm run build --prefix website >"$RESULTS_DIR/build.log" 2>&1
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
CHROMIUM_EXECUTABLE="$CHROMIUM_EXECUTABLE" node "$TOOLING_DIR/capture.mjs" IR-M-058 "$REPRO_VARIANT" "http://127.0.0.1:3000" "$RESULTS_DIR"
