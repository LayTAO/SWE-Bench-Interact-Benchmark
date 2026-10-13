#!/usr/bin/env bash
set -euo pipefail

LOG_DIR=/logs/verifier
CANONICAL_LOG_DIR="$LOG_DIR/canonical"
MODEL_PATCH=/logs/artifacts/model.patch
SUBJECT_DIR=/workspace/subject
BASE_DIR=/workspace/base

mkdir -p "$LOG_DIR" "$CANONICAL_LOG_DIR"
printf '0\n' > "$LOG_DIR/reward.txt"
printf '%s\n' '{"final_reward":0,"failure_stage":"not_started"}' > "$LOG_DIR/results.json"

patch_present=false
patch_safe=false
patch_applied=false
build_passed=false
symptom_oracle_passed=false
f2p_passed=false
p2p_passed=false
official_apply_ok=false
official_status=1
failure_stage=patch_present
patch_seconds=0
apply_seconds=0
build_seconds=0
symptom_seconds=0
official_seconds=0

if [[ -s "$MODEL_PATCH" ]]; then
  patch_present=true
else
  failure_stage=patch_present
fi

if [[ "$patch_present" == true ]]; then
  patch_start=$SECONDS
  if node /tests/verifier/check_patch.cjs "$MODEL_PATCH" >"$LOG_DIR/patch-check.log" 2>&1 \
    && git -C "$BASE_DIR" apply --check "$MODEL_PATCH" >>"$LOG_DIR/patch-check.log" 2>&1; then
    patch_safe=true
  else
    failure_stage=patch_safe
  fi
  patch_seconds=$((SECONDS - patch_start))
fi

if [[ "$patch_safe" == true ]]; then
  apply_start=$SECONDS
  rm -rf "$SUBJECT_DIR"
  cp -a "$BASE_DIR" "$SUBJECT_DIR"
  if git -C "$SUBJECT_DIR" apply "$MODEL_PATCH" >"$LOG_DIR/patch-apply.log" 2>&1; then
    patch_applied=true
  else
    failure_stage=patch_applied
  fi
  apply_seconds=$((SECONDS - apply_start))
fi

if [[ "$patch_applied" == true ]]; then
  build_start=$SECONDS
  if (cd "$SUBJECT_DIR" && pnpm run build vuetify) >"$LOG_DIR/build.log" 2>&1; then
    build_passed=true
  else
    failure_stage=build_passed
  fi
  build_seconds=$((SECONDS - build_start))
fi

if [[ "$build_passed" == true ]]; then
  symptom_start=$SECONDS
  if bash /tests/verifier/run_canonical.sh >"$CANONICAL_LOG_DIR/runner.log" 2>&1; then
    symptom_oracle_passed=true
  else
    failure_stage=symptom_oracle_passed
  fi
  if [[ -d /results ]]; then
    cp -a /results/. "$CANONICAL_LOG_DIR/" 2>/dev/null || true
  fi
  symptom_seconds=$((SECONDS - symptom_start))
fi

canonical_failure_stage="$failure_stage"
if [[ "$build_passed" == true ]]; then
  official_start=$SECONDS
  if git -C "$SUBJECT_DIR" apply --check /tests/verifier/official_test.patch \
    >"$LOG_DIR/official-apply.log" 2>&1; then
    if git -C "$SUBJECT_DIR" apply /tests/verifier/official_test.patch \
      >>"$LOG_DIR/official-apply.log" 2>&1; then
      official_apply_ok=true
    fi
  fi
  if [[ "$official_apply_ok" == true ]]; then
    set +e
    bash /tests/verifier/run_official.sh >"$LOG_DIR/official.log" 2>&1
    official_status=$?
    set -e
    if [[ -f "$LOG_DIR/official.raw.json" ]]; then
      node /tests/verifier/summarize_official.cjs \
        "$LOG_DIR/official.raw.json" /tests/verifier/evaluator.json \
        "$LOG_DIR/official.json" || true
    fi
  else
    official_status=1
  fi
  if [[ -f "$LOG_DIR/official.json" ]]; then
    f2p_value=$(node -e "const x=require('$LOG_DIR/official.json'); process.stdout.write(String(x.FAIL_TO_PASS.failed === 0));")
    p2p_value=$(node -e "const x=require('$LOG_DIR/official.json'); process.stdout.write(String(x.PASS_TO_PASS.failed === 0));")
    [[ "$f2p_value" == true ]] && f2p_passed=true
    [[ "$p2p_value" == true ]] && p2p_passed=true
  fi
  if [[ "$official_apply_ok" != true || "${official_status:-1}" != 0 \
    || "$f2p_passed" != true || "$p2p_passed" != true ]]; then
    failure_stage=official_tests
  else
    failure_stage=null
  fi
  official_seconds=$((SECONDS - official_start))
fi

if [[ "$build_passed" == true && "$symptom_oracle_passed" != true ]]; then
  failure_stage="$canonical_failure_stage"
fi

final_reward=0
if [[ "$patch_present" == true && "$patch_safe" == true && "$patch_applied" == true \
  && "$build_passed" == true && "$symptom_oracle_passed" == true \
  && "$official_apply_ok" == true && "$official_status" == 0 \
  && "$f2p_passed" == true && "$p2p_passed" == true ]]; then
  final_reward=1
  failure_stage=null
  printf '1\n' > "$LOG_DIR/reward.txt"
fi

node - "$patch_present" "$patch_safe" "$patch_applied" "$build_passed" \
  "$symptom_oracle_passed" "$f2p_passed" "$p2p_passed" "$final_reward" \
  "$official_apply_ok" "$official_status" "$failure_stage" \
  "$patch_seconds" "$apply_seconds" "$build_seconds" "$symptom_seconds" \
  "$official_seconds" <<'NODE'
const fs = require('fs');
const [patchPresent, patchSafe, patchApplied, buildPassed, symptomPassed,
  f2pPassed, p2pPassed, finalReward, officialApplyOk, officialStatus,
  failureStage, patchSeconds, applySeconds, buildSeconds, symptomSeconds,
  officialSeconds] = process.argv.slice(2);
const asBool = value => value === 'true';
const results = {
  patch_present: asBool(patchPresent),
  patch_safe: asBool(patchSafe),
  patch_applied: asBool(patchApplied),
  build_passed: asBool(buildPassed),
  symptom_oracle_passed: asBool(symptomPassed),
  f2p_passed: asBool(f2pPassed),
  p2p_passed: asBool(p2pPassed),
  official_apply_ok: asBool(officialApplyOk),
  official_status: Number(officialStatus),
  final_reward: Number(finalReward),
  durations: {
    patch_check_sec: Number(patchSeconds),
    patch_apply_sec: Number(applySeconds),
    build_sec: Number(buildSeconds),
    symptom_oracle_sec: Number(symptomSeconds),
    official_tests_sec: Number(officialSeconds),
  },
  failure_stage: failureStage === 'null' ? null : failureStage,
};
fs.writeFileSync('/logs/verifier/results.json', JSON.stringify(results, null, 2) + '\n');
NODE

[[ "$final_reward" == 1 ]]
