#!/usr/bin/env bash
set -euo pipefail

LOG_DIR=/logs/verifier
BASE_DIR=/workspace/repo
SUBJECT_DIR=/workspace/subject
ARTIFACT_DIR=/logs/artifacts
mkdir -p "$LOG_DIR" "$ARTIFACT_DIR"
printf '0\n' > "$LOG_DIR/reward.txt"
printf '%s\n' '{"final_reward":0,"failure_stage":"not_started"}' > "$LOG_DIR/results.json"

patch_present=false patch_safe=false patch_applied=false
build_passed=false symptom_oracle_passed=false
official_apply_ok=false f2p_passed=false p2p_passed=false
official_status=1 official_passed=false
failure_stage=patch_present
nop_mode="${HARBOR_NOP:-false}"

if [[ -s "$ARTIFACT_DIR/model.patch" ]]; then
  patch_present=true
else
  if [[ "$nop_mode" == true ]]; then
    patch_present=true
  else
    : > "$ARTIFACT_DIR/model.patch"
  fi
fi

if [[ "$patch_present" == true ]]; then
  if [[ "$nop_mode" == true ]]; then
    patch_safe=true
  elif node /tests/verifier/check_patch.cjs "$ARTIFACT_DIR/model.patch" >"$LOG_DIR/patch-check.log" 2>&1 \
      && git -C "$BASE_DIR" apply --check "$ARTIFACT_DIR/model.patch" >>"$LOG_DIR/patch-check.log" 2>&1; then
      patch_safe=true
    else
      failure_stage=patch_safe
    fi
fi

if [[ "$patch_safe" == true ]]; then
  rm -rf "$SUBJECT_DIR"
  cp -a "$BASE_DIR" "$SUBJECT_DIR"
  if [[ "$nop_mode" == true ]]; then
    patch_applied=true
  elif git -C "$SUBJECT_DIR" apply "$ARTIFACT_DIR/model.patch" >"$LOG_DIR/patch-apply.log" 2>&1; then
    patch_applied=true
  else
    failure_stage=patch_applied
  fi
fi

if [[ "$patch_applied" == true ]]; then
  if HARBOR_PACKAGE_MANAGER="${HARBOR_PACKAGE_MANAGER:-npm}" \
    bash /tests/verifier/run_build.sh "$SUBJECT_DIR" "$LOG_DIR"; then
    build_passed=true
  else
    failure_stage=build
  fi
fi

if [[ "$build_passed" == true ]]; then
  canonical_mode=fixed
  [[ "$nop_mode" == true ]] && canonical_mode=buggy
  if bash /tests/verifier/run_canonical.sh "$canonical_mode" "$SUBJECT_DIR" "$LOG_DIR/canonical"; then
    symptom_oracle_passed=true
  else
    failure_stage=canonical
  fi
fi

canonical_failure_stage="$failure_stage"
if [[ "$build_passed" == true ]]; then
  if git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch >"$LOG_DIR/official-apply.log" 2>&1; then
    official_apply_ok=true
    set +e
    bash /tests/verifier/run_official.sh "$SUBJECT_DIR" "$LOG_DIR" >>"$LOG_DIR/official-apply.log" 2>&1
    official_status=$?
    set -e
    if [[ -s "$LOG_DIR/official.json" ]]; then
      read -r f2p_passed p2p_passed < <(node - "$LOG_DIR/official.json" <<'NODE'
const fs = require("fs");
const result = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const f2p = result.FAIL_TO_PASS || {};
const p2p = result.PASS_TO_PASS || {};
process.stdout.write(`${f2p.failed === 0 && f2p.total > 0} ${p2p.failed === 0 && p2p.total > 0}\n`);
NODE
)
    fi
    if [[ "$official_status" == 0 && "$f2p_passed" == true && "$p2p_passed" == true ]]; then
      official_passed=true
      failure_stage=null
    else
      failure_stage=official
    fi
  else
    failure_stage=official_apply
  fi
fi

if [[ "$build_passed" == true && "$symptom_oracle_passed" != true ]]; then
  failure_stage="$canonical_failure_stage"
fi

final_reward=0
if [[ "$nop_mode" != true && "$patch_present" == true && "$patch_safe" == true && "$patch_applied" == true \
  && "$build_passed" == true && "$symptom_oracle_passed" == true \
  && "$official_apply_ok" == true && "$official_status" == 0 \
  && "$f2p_passed" == true && "$p2p_passed" == true ]]; then
  final_reward=1
  printf '1\n' > "$LOG_DIR/reward.txt"
fi

node - "$patch_present" "$patch_safe" "$patch_applied" "$build_passed" \
  "$symptom_oracle_passed" "$official_apply_ok" "$f2p_passed" "$p2p_passed" \
  "$official_status" "$final_reward" "$failure_stage" <<'NODE'
const fs = require("fs");
const [present, safe, applied, build, symptom, officialApply, f2p, p2p, officialStatus, reward, stage] = process.argv.slice(2);
const yes = value => value === "true";
fs.writeFileSync("/logs/verifier/results.json", JSON.stringify({
  patch_present: yes(present), patch_safe: yes(safe), patch_applied: yes(applied),
  build_passed: yes(build), symptom_oracle_passed: yes(symptom),
  official_apply_ok: yes(officialApply), f2p_passed: yes(f2p), p2p_passed: yes(p2p),
  official_status: Number(officialStatus),
  final_reward: Number(reward), failure_stage: stage === "null" ? null : stage,
}, null, 2) + "\n");
NODE

[[ "$final_reward" == 1 ]]
