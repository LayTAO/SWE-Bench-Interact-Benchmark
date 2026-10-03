# Repair and evaluation protocol

## Evaluation objective

A successful repair corrects the reported frontend behavior at the specified
base revision while preserving the behavior covered by the task's regression
checks. The evaluation target is the candidate source-code patch, not the
agent's explanation, its confidence, or the visual appearance of a single
screenshot.

The public artifact supplies the task inputs and Agent environment identities.
The matching evaluator, reference materials, and experiment trajectories are
maintained separately. This document describes the evaluation contract without
distributing the hidden checks or claiming that the public repository is a
complete executable evaluation harness.

## Inputs available to an agent

For a selected instance, a runner provides the released `instruction.md` and
the corresponding base environment, with the project at `/workspace/repo`.
The runner applies the CPU, memory, storage, network, and timeout settings in
`task.json`. Task selection must follow `cohort.json` when evaluating the full
paper cohort.

Reference patches and hidden evaluator assets are not agent inputs. Ordinary
tests shipped by the upstream project may already be present in the source
environment; these are distinct from the private benchmark evaluation suite.
Experiment reports should disclose whether an agent can browse issue threads,
upstream history, or other external information that may reveal a fix.

## Candidate-patch contract

The agent should produce the implementation change needed to fix the reported
defect. Follow the task-specific instruction for the output location; for
example, the Vuetify instance requests `/logs/artifacts/model.patch`.

A candidate must be nonempty where a repair is required, respect the task's
patch-safety constraints, and apply to the exact base revision. Changes to
hidden tests or evaluator behavior are not a substitute for repairing the
subject project. Diagnostic reproductions or tests created by an agent can aid
development, but they do not define the acceptance criterion.

Patch collection must include every intended production change. In a Git
workspace, a plain `git diff --binary` captures tracked working-tree changes
but does not automatically include untracked files or already staged changes.
A runner must account for those cases and check the patch against a fresh base
before treating it as the complete submission. Do not include unrelated files,
credentials, dependency caches, or logs in the candidate patch.

## Evaluation dimensions

The task-specific evaluator determines the exact commands and acceptance
conditions. The protocol distinguishes the following requirements:

1. **Patch validity and application.** The candidate is present, satisfies
   patch restrictions, and applies to a clean copy of the task's base source.
2. **Build and execution readiness.** The patched project satisfies the
   preparation and build steps required to run the checks.
3. **Behavioral correctness.** The canonical interaction check exercises the
   reported scenario and checks the relevant observable outcome. A failure to
   initialize or trigger the scenario is not evidence of a repaired symptom.
4. **Fail-to-pass (F2P) checks.** Tests designated to expose the defect must pass
   after the repair.
5. **Pass-to-pass (P2P) checks.** Tests designated to protect existing behavior
   must continue to pass after the repair.

An accepted repair must satisfy all requirements of its evaluator. A passing
F2P suite does not compensate for a failing interaction check or a regression.
Likewise, an agent-authored test that passes cannot override a failed canonical
check. Exact execution order and report-field names can differ by task; the
dimensions above are not a promise of a single universal runner or log schema.

## Interpreting results

Per-task acceptance is binary under the corresponding evaluation contract.
Stage-level information is useful for explaining unsuccessful repairs, but
partial progress is not equivalent to a solved instance. Infrastructure errors,
timeouts, invalid patches, behavioral failures, and regressions should remain
distinguishable in analysis.

For a one-candidate-per-task experiment on the full cohort, report the number
of accepted instances out of 103 along with the evaluated coverage. If a task
was not attempted or its evaluation did not complete, disclose that fact rather
than silently reducing the denominator. Multi-attempt experiments should state
their attempt budget, candidate selection rule, and aggregation method; they
are not directly interchangeable with a single-attempt result.

The repository does not publish model scores or a leaderboard. It also does not
define a universal policy for retrying infrastructure failures. Reports should
state such policies and retain sufficient evidence to distinguish a retry from
an additional repair attempt.

## Reproducible experiment reporting

Record the artifact version and Git revision, the exact cohort or subset, and
the Agent image digest for every instance. Also report the agent/model version,
sampling settings, tool access, time and resource budgets, network policy,
attempt count, patch-extraction method, and evaluation version supplied by the
maintainers. These factors can affect results even when the task set is fixed.

Optional evaluation hashes in the public records are not complete across the
cohort. They must not be presented as a complete lockfile for the evaluator.
For authorized evaluation, agree on the matching evaluator version separately.

## Access and reproducibility boundary

Public files are sufficient to inspect tasks, retrieve environments, and produce
candidate repairs. They are not sufficient to independently reproduce official
scores because the hidden interaction checks and regression assets are withheld.
The repository provides neither a hosted submission endpoint nor an automatic
evaluation-access entitlement. Evaluation access must be arranged separately
with the maintainers.

Task recipes and metadata identify the intended artifacts; they do not prove
that all published container layers are free of sensitive material. Registry
permissions and image-layer contents require separate checks. The public
release intentionally omits verifier image references and execution artifacts.

See [DATASET_CARD.md](DATASET_CARD.md) for coverage and limitations, and
[BUILDING.md](BUILDING.md) for the distinction between retrieving a frozen
environment and reconstructing one from a recipe.
