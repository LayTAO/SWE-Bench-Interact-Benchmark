# Dataset card

## Scope and intended use

SWE-Bench-Interact is a software-repair benchmark for frontend defects that
require user interaction to expose or validate. The unit of evaluation is an
issue-level repair task: an upstream project at a specified base revision,
an agent-visible problem statement, an execution environment, and a candidate
patch assessed by the corresponding evaluator.

The public release supports inspection of the task set, development of agent
integrations, retrieval of frozen Agent environments, and generation of repairs.
It is not a dataset of agent trajectories and does not distribute the hidden
evaluation implementation. Public-artifact access and official-evaluation access
are separate concerns.

## Provenance and release membership

The task records identify InteractRepair 4.0 as their source benchmark, `interact`
as their track, and `accepted` as their source status. The release selects the
103 issues used across the eight experiment groups in the paper workflow.
[cohort.json](cohort.json) is the authoritative membership list; source status
does not mean that an evaluated agent successfully repaired the issue.

The larger authoring collection is not the public evaluation cohort. No extra
instances are included merely because an environment exists for them. Internal
experiment selections and trajectory records are not needed to enumerate the
released tasks and are not distributed here.

## Composition

The cohort contains **103 tasks across 28 upstream repositories**. The largest
contributors are `unovue/reka-ui` (20), `adobe/react-spectrum` (17),
`ariakit/ariakit` (10), `mui/base-ui` (9), and
`carbon-design-system/carbon` (8). These five projects account for 64 tasks;
the remaining 39 tasks come from 23 projects. Consequently, the distribution is
not balanced across repositories.

The public `reproduction_type` metadata contains:

- `minimal-app-playwright`: 78 tasks;
- `repo-native-playwright`: 23 tasks;
- `official-browser-test`: 1 task;
- unspecified (`null`): 1 task.

These are provenance labels for the task's reproduction setup, not outcome
labels, difficulty ratings, or independent benchmark splits. The corresponding
hidden reproduction code is not distributed in the public artifact.

All task environments specify Linux, 2 CPUs, a storage limit of 20,480 MB,
a 1,800-second agent timeout, and network mode `public`. Memory is 4,096 MB for
96 tasks and 8,192 MB for seven tasks. These values are execution metadata;
they are not measurements of image download size or peak resource consumption.
An integration must enforce them rather than assume that pulling an image does
so automatically.

## Public data and metadata coverage

Every instance has an instruction, task record, base-commit identifier,
digest-pinned Agent image reference, and Dockerfile. `tasks.jsonl` repeats the
per-instance records for batch processing. `builds.json` describes 100
source-context recipes and three image-overlay recipes.

Optional evaluation metadata is incomplete in this release:

- F2P and P2P counts are populated for one task and `null` for 102 tasks.
- Evaluation commitments are populated for one task and empty for 102 tasks.
- Reproduction-type metadata is populated for 102 tasks.

These gaps concern the public metadata, not the existence of the underlying
private tests. Do not calculate benchmark-wide test totals by converting
`null` to zero, and do not claim full evaluator-version identification from the
published hashes alone. Definitions and parsing rules appear in
[TASK_FORMAT.md](TASK_FORMAT.md).

## Materials outside this release

Reference solutions, fixed-commit fields, hidden tests, verifier implementation
and image references, experimental job configurations, agent conversations,
trajectories, logs, screenshots, videos, and browser traces are excluded from
the public Git artifact. Agent-visible instructions remain available because
they are the task inputs.

Container images are referenced by digest and stored outside Git. Publication
of the Git artifact does not by itself certify image availability, the contents
of every historical image layer, or registry access controls. These require
separate operational checks.

## Interpretation and limitations

### Domain and project coverage

The cohort emphasizes interaction-heavy frontend and component-library repair.
It should not be interpreted as a representative sample of backend development,
security engineering, all UI work, or software maintenance in general. Project
concentration can influence aggregate scores; repository-level breakdowns can
help contextualize results.

### Public-source exposure

The underlying repositories and issue discussions are public. Issue links,
upstream commits, release notes, and related discussions may expose a fix.
Removing reference solutions from this artifact cannot eliminate prior model
exposure or deliberate retrieval of upstream answers. Experiments should state
their network, retrieval, and external-information policies.

### Environment reconstruction

A frozen image and a newly rebuilt image are different experimental artifacts
unless equivalence has been established. Build recipes may depend on external
services, mutable tags, and architecture-specific binaries. No all-task rebuild
validation is claimed by this release.

### Evaluation access

The public files alone cannot reproduce official scores. Hidden behavioral
checks and regression suites are evaluated separately. This repository does
not contain a public leaderboard, hosted submission endpoint, or complete
Harbor runner configuration. Locally observed behavior should not be labeled
an official pass without the corresponding evaluator result.

## Versioning and integrity

Use `VERSION` together with the Git revision to identify an artifact snapshot.
`cohort.json` fixes membership; `MANIFEST.sha256` records the released file bytes;
image digests identify container artifacts. Changes to membership, instructions,
base revisions, environment identities, or evaluation semantics should be
documented as benchmark changes rather than silently treated as equivalent data.

An anonymizing mirror can replace strings in file contents. Its transformed
files will not necessarily match the original checksum manifest. This is a
presentation transformation, not evidence that the original file checksums were
incorrect. Verify checksums against the exact, unmodified release bytes.

## Licensing

Upstream repositories and bundled dependencies retain their individual licenses.
No benchmark-specific license has yet been designated for the authored release
materials. Users should review applicable licenses and obtain any additional
permissions necessary for their intended redistribution or reuse.
