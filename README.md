# SWE-Bench-Interact

SWE-Bench-Interact contains 103 Web-interaction repair tasks from 28 repositories.
Every task includes an issue instruction, an exact base revision, a reproduction
page, behavioral checks, and selected developer tests.

## Requirements

Use Python 3.12, Harbor 0.22.0, Docker with Compose, and Linux x86-64 container
support. Agent and verifier images are pinned by registry digest in
`images.lock.json`; image archives are not stored in GitHub. Resource limits and
timeouts are specified separately for each task's agent and verifier in
`task.toml`. Size concurrency for both phases and leave memory for the host.

```bash
python3 -m venv .venv
.venv/bin/pip install harbor==0.22.0
python3 runtime/validate.py
python3 runtime/prepare.py --output ../interactbench-prepared
```

Preparation expands shared materials into native Harbor task directories. It
does not build images. Identical evaluator files are stored once in `shared/`;
each task's `tests/materials.json` specifies its exact files and SHA-256 hashes.

## Run an evaluation

Set the credentials required by your chosen agent using its documented
environment variables. In `../interactbench-prepared/job.json`, set the agent,
model, job output directory, and concurrency. The example starts with one
concurrent trial and one attempt per task. Configure provider hosts in the
agent network policy if your provider differs from the task defaults.

```bash
.venv/bin/harbor run --config ../interactbench-prepared/job.json
python3 runtime/summarize.py /absolute/path/to/your/job
```

For a single task, point a job's `tasks` entry at its prepared task directory and
remove the `datasets` entry. New agent implementations can reuse the same task
definitions and independent evaluator.

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
