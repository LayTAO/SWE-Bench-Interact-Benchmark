#!/usr/bin/env bash
set -euo pipefail
export PATH=/opt/node/bin:$PATH
cd "$SUBJECT_DIR"
yarn storybook >"$RESULTS_DIR/storybook.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 180); do
  if curl -fsS http://127.0.0.1:9009/ >/dev/null 2>&1; then break; fi
  kill -0 "$server_pid"
  sleep 1
done
curl -fsS http://127.0.0.1:9009/ >/dev/null
node /tests/verifier/cypress-results.cjs
