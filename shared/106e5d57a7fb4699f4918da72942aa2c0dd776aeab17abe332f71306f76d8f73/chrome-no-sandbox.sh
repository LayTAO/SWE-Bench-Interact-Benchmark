#!/usr/bin/env bash
set -euo pipefail
exec /ms-playwright/chromium-1208/chrome-linux64/chrome --no-sandbox "$@"
