# SWE-Bench-Interact Benchmark

SWE-Bench-Interact is a benchmark for evaluating software-engineering agents on
interaction-heavy frontend repair tasks.  This public artifact contains the task
descriptions, immutable Agent environment image references, execution metadata,
and cryptographic commitments needed to identify the evaluation materials.

## Release contents

- `tasks.jsonl`: machine-readable index of all tasks.
- `tasks/<instance_id>/instruction.md`: the instruction visible to the Agent.
- `tasks/<instance_id>/task.json`: public task metadata and Agent environment.
- `tasks/<instance_id>/environment/Dockerfile`: Agent environment recipe.
- `builds.json`: recipe hashes and source/overlay build requirements.
- `scripts/pull_agent_images.py`: helper for pulling immutable Agent images.
- `scripts/prepare_agent_build.py`: prepare an isolated build context.
- `BUILDING.md`: build instructions and reproducibility limitations.
- `MANIFEST.sha256`: checksums for every released file.

This release contains **111 accepted tasks** from InteractRepair 4.0.

## Deliberate disclosure boundary

The release does not contain gold patches, fixed commits, hidden tests, verifier
source, verifier images, Oracle/NOP jobs, Agent trajectories, prompts, complete
logs, screenshots, videos, traces, or internal infrastructure paths.  Container
images listed here are Agent environments only.  A container image must not be
treated as a security boundary; hidden evaluation assets are not embedded in the
published images.

Evaluation materials are identified by SHA-256 commitments in each task record.
The commitments support version checking without disclosing the hidden assets.
See `EVALUATION.md` for the evaluation and access model.

## Quick start

List tasks:

```bash
python3 -c 'import json; print("\n".join(json.loads(line)["instance_id"] for line in open("tasks.jsonl")))'
```

Pull one Agent image:

```bash
python3 scripts/pull_agent_images.py --instance vuetifyjs__vuetify-22850
```

Pulling all 111 images requires substantial network bandwidth and disk space, so
the helper requires `--all` explicitly.

To inspect or rebuild an Agent environment, see [BUILDING.md](BUILDING.md).
The recipes include source builds and overlays on existing Agent images; they
are not a guarantee of byte-identical reconstruction of the frozen images.

## Images and upstream licensing

The image references are immutable digest references hosted on Docker Hub.  The
images contain snapshots of upstream open-source repositories and installed
dependencies.  Those materials remain governed by their respective upstream
licenses; this repository does not relicense them.  Review the applicable
upstream licenses and notices before redistribution.

No license for the benchmark-authored files has been selected in this initial
artifact release.  A release license should be added explicitly by the authors.

## Citation

See `CITATION.cff`.  Replace the provisional title and version metadata with the
camera-ready paper citation when available.
