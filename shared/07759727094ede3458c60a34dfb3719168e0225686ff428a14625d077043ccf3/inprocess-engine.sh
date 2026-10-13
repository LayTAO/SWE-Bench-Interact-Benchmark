#!/usr/bin/env bash
set -euo pipefail

action="${1:-}"
shift || true
case "$action" in
  rm|stop|kill)
    exit 0
    ;;
  run)
    ;;
  *)
    echo "unsupported in-process container operation: $action" >&2
    exit 125
    ;;
esac

env_args=()
mounts=()
workdir=
image=
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --)
      shift
      break
      ;;
    --rm|--detach|--init|--privileged|--ipc=*)
      shift
      ;;
    --ipc|--ulimit|--name|--user|--network|--entrypoint)
      [[ "$#" -ge 2 ]] || { echo "missing option value: $1" >&2; exit 125; }
      shift 2
      ;;
    --workdir|-w)
      [[ "$#" -ge 2 ]] || { echo "missing workdir" >&2; exit 125; }
      workdir="$2"
      shift 2
      ;;
    --env|-e)
      [[ "$#" -ge 2 ]] || { echo "missing environment value" >&2; exit 125; }
      env_args+=("$2")
      shift 2
      ;;
    --env=*)
      env_args+=("${1#--env=}")
      shift
      ;;
    -e*)
      env_args+=("${1#-e}")
      shift
      ;;
    --volume|-v)
      [[ "$#" -ge 2 ]] || { echo "missing volume value" >&2; exit 125; }
      mounts+=("$2")
      shift 2
      ;;
    -v*)
      mounts+=("${1#-v}")
      shift
      ;;
    --volume=*)
      mounts+=("${1#--volume=}")
      shift
      ;;
    -*)
      shift
      ;;
    *)
      image="$1"
      shift
      break
      ;;
  esac
done

[[ -n "$image" ]] || { echo "in-process container image is missing" >&2; exit 125; }

snapshot_root="$(mktemp -d /tmp/harbor-inprocess-mounts.XXXXXX)"
trap 'rm -rf -- "$snapshot_root"' EXIT HUP INT TERM
resolved_mounts=()
for spec in "${mounts[@]}"; do
  source_path="${spec%%:*}"
  remainder="${spec#*:}"
  target_path="${remainder%%:*}"
  [[ "$source_path" != "$spec" && -n "$target_path" ]] || {
    echo "invalid in-process volume: $spec" >&2
    exit 125
  }
  needs_snapshot=0
  for other_spec in "${mounts[@]}"; do
    other_source="${other_spec%%:*}"
    other_remainder="${other_spec#*:}"
    other_target="${other_remainder%%:*}"
    if [[ "$source_path" != "$other_target" && "$source_path" == "$other_target"/* ]]; then
      needs_snapshot=1
      break
    fi
  done
  if [[ "$needs_snapshot" == 1 ]]; then
    snapshot_path="$snapshot_root/${#resolved_mounts[@]}"
    cp -a -- "$source_path" "$snapshot_path"
    spec="$snapshot_path:$remainder"
  fi
  resolved_mounts+=("$spec")
done
mounts=("${resolved_mounts[@]}")
copyback_mounts=()
for spec in "${mounts[@]}"; do
  remainder="${spec#*:}"
  target_path="${remainder%%:*}"
  case "$target_path" in
    /results|/state-cache)
      copyback_mounts+=("$spec")
      ;;
  esac
done
backup_targets=()
backup_paths=()
for spec in "${mounts[@]}"; do
  source_path="${spec%%:*}"
  remainder="${spec#*:}"
  target_path="${remainder%%:*}"
  source_resolved="$(realpath -m -- "$source_path")"
  target_resolved="$(realpath -m -- "$target_path")"
  if [[ "$source_resolved" != "$target_resolved" ]]; then
    backup_targets+=("$target_path")
    if [[ -e "$target_path" || -L "$target_path" ]]; then
      backup_path="$snapshot_root/target-${#backup_paths[@]}"
      mv -- "$target_path" "$backup_path"
      backup_paths+=("$backup_path")
    else
      backup_paths+=("")
    fi
  fi
done

for spec in "${mounts[@]}"; do
  source_path="${spec%%:*}"
  remainder="${spec#*:}"
  target_path="${remainder%%:*}"
  [[ "$source_path" != "$spec" && -n "$target_path" ]] || {
    echo "invalid in-process volume: $spec" >&2
    exit 125
  }
  case "$target_path" in
    /oracle|/oracle-src|/subject|/subject-artifact|/tooling|/runner|/runner/*|/tests|/results|/state-cache|/workspace/app|/workspace/results|/workspace/repo|/workspace/subject|/subject/node_modules|/logs|/runtime|/canonical|/pnpm-store|/tooling-cache|/app-node-modules-cache|/bazel-cache|/workspace/npm-cache)
      ;;
    *)
      echo "refusing in-process volume target: $target_path" >&2
      exit 125
      ;;
  esac
  [[ -e "$source_path" || -L "$source_path" ]] || {
    echo "in-process volume source is missing: $source_path" >&2
    exit 125
  }
  source_resolved="$(realpath -m -- "$source_path")"
  target_resolved="$(realpath -m -- "$target_path")"
  if [[ "$source_resolved" != "$target_resolved" ]]; then
    case "$target_path" in
      /results|/state-cache)
        mkdir -p -- "$target_path"
        if [[ -d "$source_path" ]]; then
          cp -a -- "$source_path"/. "$target_path"/
        else
          cp -a -- "$source_path" "$target_path"
        fi
        ;;
      *)
        mkdir -p -- "$(dirname -- "$target_path")"
        ln -s -- "$source_path" "$target_path"
        ;;
    esac
  fi
done

if [[ -n "$workdir" ]]; then
  cd -- "$workdir"
fi
status=0
env "${env_args[@]}" "$@" || status=$?
for spec in "${copyback_mounts[@]}"; do
  source_path="${spec%%:*}"
  remainder="${spec#*:}"
  target_path="${remainder%%:*}"
  source_resolved="$(realpath -m -- "$source_path")"
  target_resolved="$(realpath -m -- "$target_path")"
  if [[ "$source_resolved" != "$target_resolved" && -d "$source_path" && -d "$target_path" ]]; then
    find "$source_path" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    cp -a -- "$target_path"/. "$source_path"/
  fi
done
for ((index=${#backup_targets[@]} - 1; index >= 0; index--)); do
  target_path="${backup_targets[index]}"
  rm -rf -- "$target_path"
  if [[ -n "${backup_paths[index]}" ]]; then
    mv -- "${backup_paths[index]}" "$target_path"
  fi
done
exit "$status"


