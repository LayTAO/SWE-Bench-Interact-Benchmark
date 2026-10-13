#!/usr/bin/env bash
set -euo pipefail
: "${SUBJECT_DIR:?SUBJECT_DIR must point to an exact checkout with dependencies installed}"
: "${OUTPUT_BASE:?OUTPUT_BASE is required}"
cd "$SUBJECT_DIR"
args=(--output_base="$OUTPUT_BASE" build)
if [[ -n "${BAZEL_REPOSITORY_CACHE:-}" ]]; then
  args+=(--repository_cache="$BAZEL_REPOSITORY_CACHE")
fi
args+=(//src/dev-app:web_package)
yarn -s bazel "${args[@]}"
printf '%s\n' "$OUTPUT_BASE/execroot/angular_material/bazel-out/k8-fastbuild/bin/src/dev-app/web_package"
