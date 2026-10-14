# SWE-Bench-Interact

SWE-Bench-Interact contains 103 Web-interaction repair tasks from 28 repositories.
Every task includes an issue instruction, an exact base revision, a reproduction
page, behavioral checks, and selected developer tests.

## Requirements

Use Python 3.12, Git, Harbor 0.22.0, Docker with Compose and BuildKit, and Linux
x86-64 container support. This is a **source-build distribution**: each task
provides independent Agent and Verifier Dockerfiles. No prebuilt task image
from the benchmark maintainers is required. Public Node and Playwright base
images, upstream source, package registries, and browser downloads must be
reachable during preparation and image construction.

Resource limits and timeouts are specified separately for each task's agent
and verifier in `task.toml`. Image builds also consume host memory and disk;
start with one task before increasing concurrency.

```bash
python3 -m venv .venv
.venv/bin/pip install harbor==0.22.0
python3 runtime/validate.py
python3 runtime/prepare.py \
  --instance unovue__reka-ui-2749 \
  --output ../interactbench-single
```

Preparation fetches the exact base commit, verifies its identity, and exports
source without upstream Git history into each build context. It also expands
the shared evaluation materials. Existing output directories are never
overwritten. Keep generated source, caches, images, and results outside this
release repository.

To prepare the full frozen cohort instead:

```bash
python3 runtime/prepare.py --all --output ../interactbench-prepared
```

Both Dockerfiles receive the same base source. Evaluation materials are copied
only into the Verifier context. Preparation records source archive hashes in
`build-inputs.json`; Dockerfile hashes are recorded in `builds.json`.

## Run an evaluation

Set the credentials required by your chosen agent using its documented
environment variables. In `../interactbench-single/job.json`, set the agent,
model, job output directory, and concurrency. The example starts with one
concurrent trial and one attempt per task. Configure provider hosts in the
agent network policy if your provider differs from the task defaults.

```bash
.venv/bin/harbor run --config ../interactbench-single/job.json
python3 runtime/summarize.py /absolute/path/to/your/job
```

Harbor builds the Agent and Verifier images locally from the prepared
Dockerfiles. There are no `docker_image` references to maintainer-built task
images in the task configurations. Docker's build cache can be reused. For
the full cohort, use `../interactbench-prepared/job.json` instead.

Rebuilding is not a claim of byte-for-byte equivalence with historical images.
The frozen source, supplied recipes, and unchanged evaluation tests define
this source release; full build and execution validation status is recorded
in `release.json`.

## Evaluation

The agent works on the base checkout in `/workspace/repo`. A shared runtime
captures its production patch. Harbor transfers that patch to a fresh,
independent verifier environment. Evaluation assets are mounted only in the
verifier; they are not mounted in the agent environment.

The verifier applies the candidate to the base source, performs the required
build, runs the fixed browser reproduction and behavioral checks, and executes
the selected F2P and P2P tests. A failed browser check does not by itself skip
the developer tests when their prerequisites are satisfied.

`reward=1` requires a valid candidate patch, a successful required build,
passing canonical browser behavior, all F2P tests passing, and all P2P tests
passing. Otherwise, `reward=0`. Agent-authored tests do not replace these checks.
Resolved rate is the number of tasks with `reward=1` divided by the task count.
