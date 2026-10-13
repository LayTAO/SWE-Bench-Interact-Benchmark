#!/usr/bin/env bash
set -euo pipefail
export SUBJECT_DIR="${1:?subject directory}" OUTPUT_DIR="${2:?output directory}/source-build"
bash /tests/canonical_repro/scripts/build.sh
