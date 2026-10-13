#!/usr/bin/env bash
set -euo pipefail

# Shared by all tasks. Never change the agent's index or its commit history.
mode=${1:?snapshot or export}
repo=${2:?repository}
state=${3:?baseline directory}
out=${4:-/logs/artifacts}
mkdir -p "$state"
cd "$repo"
git rev-parse --is-inside-work-tree >/dev/null
index_dir=$(mktemp -d "${TMPDIR:-/tmp}/interactbench-index.XXXXXX")
trap 'rm -f -- "$index_dir/index" "$index_dir/index.lock"; rmdir -- "$index_dir"' EXIT
export GIT_INDEX_FILE="$index_dir/index"

case "$mode" in
  snapshot)
    # Health checks can be repeated; retain the first pre-agent snapshot.
    if [[ -s "$state/tree" ]]; then
      git cat-file -e "$(<"$state/tree")^{tree}"
      exit 0
    fi
    git read-tree HEAD
    git add -A -- .
    git write-tree > "$state/tree"
    ;;
  export)
    [[ -s "$state/tree" ]] || { echo 'Missing pre-agent snapshot' >&2; exit 2; }
    baseline=$(<"$state/tree")
    [[ "$baseline" =~ ^[0-9a-f]{40}$ ]] || exit 2
    git cat-file -e "$baseline^{tree}"
    git read-tree "$baseline"
    git add -A -- .
    mkdir -p "$out"
    git diff --cached --binary --no-ext-diff --no-textconv "$baseline" -- > "$out/agent-full.patch"
    git diff --cached --binary --no-ext-diff --no-textconv "$baseline" -- . \
      ':(exclude,glob).repro/**' ':(exclude,glob)**/.repro/**' \
      ':(exclude,glob)test/**' ':(exclude,glob)tests/**' \
      ':(exclude,glob)**/test/**' ':(exclude,glob)**/tests/**' \
      ':(exclude,glob)**/__tests__/**' ':(exclude,glob)**/*.test.*' \
      ':(exclude,glob)**/*.spec.*' ':(exclude,glob)*.test.*' ':(exclude,glob)*.spec.*' \
      ':(exclude,glob)node-compile-cache/**' ':(exclude,glob)**/node-compile-cache/**' \
      > "$out/model.patch"
    ;;
  *) echo 'Expected snapshot or export' >&2; exit 2 ;;
esac
