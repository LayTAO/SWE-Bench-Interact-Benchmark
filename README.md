# SWE-Bench-Interact

### A benchmark for interaction-driven frontend software repair

SWE-Bench-Interact evaluates whether software-engineering agents can repair real
frontend defects whose symptoms depend on user interaction. A task starts from
an issue description and a particular revision of an upstream project. The
agent must investigate the implementation, reason about the reported behavior,
and produce a source-code patch that corrects the defect without breaking
existing behavior.

This repository is the **public task and environment artifact** for the paper
cohort: **103 repair tasks from 28 upstream repositories**, derived from the
accepted interaction track of InteractRepair 4.0. It provides task instructions,
base-commit identities, digest-pinned Agent image references, and environment
build recipes. Experiment trajectories and the private evaluation implementation
are not part of this release.

[Dataset card](DATASET_CARD.md) · [Task format](TASK_FORMAT.md) ·
[Environment guide](BUILDING.md) · [Evaluation protocol](EVALUATION.md)

## Motivation

Frontend correctness is often a property of an interaction sequence rather than
a single function call or a static page. A component can render successfully
yet behave incorrectly when a user opens a menu, moves focus, scrolls a popup,
or combines multiple controls. Reproducing such a failure requires establishing
the relevant UI state and then performing the actions that expose the defect.

SWE-Bench-Interact focuses on this connection between observable behavior and
implementation. The repair problem involves understanding the issue, finding
the code responsible for the interaction, and preserving the behavior of related
components. The evaluation protocol combines task-specific behavioral checks
with regression tests; passing a build or an agent-written reproduction alone
does not establish that a task is solved.

## What constitutes a task?

Each instance identifies an upstream repository and issue, an exact base commit,
an agent-visible instruction, and a frozen execution environment. The expected
output is a patch against that base revision, not a prose diagnosis or a change
to the evaluation code.

For example, [vuetifyjs__vuetify-22850](tasks/vuetifyjs__vuetify-22850/instruction.md)
describes a dropdown that closes during scrolling when menu transitions are
disabled. The intended repair must preserve the open menu under the reported
interaction while avoiding regressions in existing component behavior. Its
[task record](tasks/vuetifyjs__vuetify-22850/task.json) identifies the source
revision and Agent image used for that instance.

The 103-instance membership is fixed in [cohort.json](cohort.json). It is the
same issue set used across the eight experiment groups in the paper workflow.
The cohort is not defined by whichever tasks happen to exist in the larger
authoring collection. Experiments on a subset should identify that subset
explicitly rather than describe it as the full benchmark.

## Repository organization

```text
.
├── README.md                   Project overview and entry points
├── DATASET_CARD.md             Scope, composition, provenance, and limitations
├── TASK_FORMAT.md              Public record and artifact specifications
├── BUILDING.md                 Image retrieval and environment reconstruction
├── EVALUATION.md               Repair contract and scoring boundary
├── CITATION.cff                Machine-readable artifact citation
├── VERSION                    Artifact version
├── cohort.json                Fixed paper-cohort membership
├── tasks.jsonl                One public task record per line
├── builds.json                Dockerfile hashes and build modes
├── MANIFEST.sha256             Released-file checksums
├── scripts/
│   ├── pull_agent_images.py    Pull selected digest-pinned images
│   └── prepare_agent_build.py  Prepare an isolated Docker build context
└── tasks/<instance_id>/
    ├── instruction.md         Agent-visible repair instruction
    ├── task.json              Repository, environment, and optional metadata
    └── environment/Dockerfile Agent environment recipe
```

The public JSON format is documented in [TASK_FORMAT.md](TASK_FORMAT.md). This
repository is not a complete Harbor task bundle: it does not distribute the
private `task.toml`, hidden tests, verifier configuration, or job definitions.
Using it with an execution framework requires an adapter that supplies the
instruction, environment, limits, and patch collection described here.

## Getting started

Run these examples from the repository root. Inspecting the index and pulling
images require Python 3; pulling also requires a working Docker installation.
Preparing a source build requires Python 3.12 or newer and Git.

### 1. Inspect the cohort

```bash
python3 - <<'PY'
import json
from pathlib import Path

records = [json.loads(line) for line in Path("tasks.jsonl").read_text().splitlines()]
print("Tasks:", len(records))
print("Repositories:", len({r["repository"]["name"] for r in records}))
for record in records:
    print(record["instance_id"], record["repository"]["base_commit"])
PY
```

The release contains 103 records and 28 distinct repository names. Read the
selected task's `instruction.md` before running an agent; resource metadata and
the image reference are in its adjacent `task.json`.

### 2. Retrieve an Agent environment

```bash
python3 scripts/pull_agent_images.py --instance vuetifyjs__vuetify-22850
```

The helper pulls the exact image named by `agent_environment.image`. Image
layers are distributed through the container registry, **not as binary files
inside this Git repository**. The Dockerfiles are build recipes, not the images
themselves. Pulling all images is an explicit opt-in because it can consume
substantial network bandwidth and storage.

### 3. Produce and evaluate a repair

Run your agent in an isolated environment using the released instruction and
the task-specific limits. The project workspace is `/workspace/repo`; collect
the candidate patch as specified in the instruction. The pull helper does not
start an agent, enforce resource limits, or evaluate a patch.

Use [BUILDING.md](BUILDING.md) for environment preparation and
[EVALUATION.md](EVALUATION.md) for the patch contract. Official evaluation
requires the matching private evaluator. This repository does not provide a
hosted submission service or a command that reproduces official scores using
only the public files.

## Reproducibility boundaries

Three identities serve different purposes: the **base commit** identifies the
upstream source revision; the **image digest** identifies the released container
artifact; and the **Dockerfile checksum** identifies the published recipe text.
They should not be treated as interchangeable evidence.

All 103 tasks have a Dockerfile. Of these, 100 use a source build context and
three extend an existing Agent image. Rebuilding the recipes has not been
verified as part of this public release, and a rebuild is not guaranteed to
produce the frozen image digest. External package services, mutable base tags,
build tools, timestamps, and CPU architecture can affect reconstruction.

Optional evaluation counts and hashes are incomplete in the current public
metadata. A missing value is not a zero-test suite, and an absent hash does not
mean an evaluation asset does not exist. See the dataset card for coverage.

## Public and withheld materials

The public artifact supports task inspection, environment retrieval, and
candidate-patch generation. It intentionally excludes reference patches,
fixed-commit fields, hidden evaluation code, verifier image references, Harbor
job definitions, agent conversations, trajectories, and execution recordings.
The task instructions themselves are public; experiment-specific prompts and
conversation histories are not included.

This separation defines the contents of the Git artifact. It does not constitute
a security audit of all container layers or external registry permissions.
Upstream issue discussions and public project history can also reveal fixes;
the release cannot guarantee the absence of training-data contamination.

## Licensing and citation

Upstream source code, dependencies, browser binaries, and container base images
retain their respective licenses. Their inclusion in an environment does not
relicense them. No separate license for benchmark-authored materials has yet
been selected in this artifact release; public availability alone should not be
interpreted as a grant of unrestricted redistribution rights.

[CITATION.cff](CITATION.cff) records the artifact citation. Paper bibliographic
metadata will need to be finalized with the publication. When reporting an
experiment, also record the artifact version, repository revision, cohort, and
image digests so that the evaluated task set can be identified precisely.
