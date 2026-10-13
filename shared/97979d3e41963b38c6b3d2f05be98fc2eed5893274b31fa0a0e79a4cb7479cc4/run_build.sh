#!/usr/bin/env bash
set -euo pipefail
SUBJECT_DIR="${1:?subject directory}"
OUTPUT_DIR="${2:?output directory}"
RUNNER_JSON=/tests/verifier/runner.json
mkdir -p "$OUTPUT_DIR"
build_command="$(node - "$RUNNER_JSON" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const runner = JSON.parse(fs.readFileSync(file, 'utf8'));
if (typeof runner.build_command === 'string') process.stdout.write(runner.build_command);
NODE
)"

if [[ -z "$build_command" ]]; then
  printf '%s\n' 'No explicit build_command declared; build gate is not applicable.' >"$OUTPUT_DIR/build.log"
else
  (cd "$SUBJECT_DIR" && bash -lc "$build_command") >"$OUTPUT_DIR/build.log" 2>&1
fi
