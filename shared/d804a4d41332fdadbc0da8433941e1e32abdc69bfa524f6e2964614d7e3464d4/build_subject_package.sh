#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?SUBJECT_DIR is required}"
git -C "$SUBJECT_DIR" rev-parse --verify HEAD
echo "Exact subject checkout is available at $SUBJECT_DIR"
