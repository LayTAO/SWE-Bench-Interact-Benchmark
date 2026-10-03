# Agent environments: pull, inspect, and build

Use the digest in `task.json` to run the released environment. The Dockerfiles
document the Agent environment recipes in the authoring repository at the time
of this addition. They have not all been rebuilt as part of this public release;
`builds.json` records this explicitly. A recipe checksum identifies its text, not
proof that rebuilding it reproduces the released image digest.

## Pull the released image

From the repository root, with Python 3 and Docker installed:

```bash
python3 scripts/pull_agent_images.py --instance vuetifyjs__vuetify-22850
```

The immutable reference is in `tasks/<instance_id>/task.json` under
`agent_environment.image`. Read `instruction.md` for the problem statement.
The source workspace is `/workspace/repo` inside the image. Apply the resource
and time limits from the task metadata when running an Agent. The pull helper
downloads images only; it does not run an Agent or score patches.

## Build-context requirements

There are 111 Agent Dockerfiles in `tasks/*/environment/Dockerfile`:

- 108 recipes copy `base/` into `/workspace/repo`. The helper fetches the task's
  exact base commit and exports it with `git archive`, without upstream history.
- Three recipes overlay an existing Agent image: `ariakit__ariakit-1652`,
  `mui__material-ui-45301`, and `radix-ui__primitives-4014`. Their source and
  dependencies are inherited from the digest-pinned `FROM` image. These are
  **not standalone from-source recipes**; their parent images must be available.

`builds.json` lists each recipe's mode, SHA-256, parent images, and verification
status. Some recipes use `INSTALL_COMMIT` instead of `BASE_COMMIT`; the exporter
checks that either declaration agrees with the task's base commit.

## Prepare and build one task

Requirements: Python 3.12+, Git, and Docker with BuildKit. The example uses
`linux/amd64` because some recipes download x86-64 binaries explicitly. An ARM
machine needs emulation or an x86-64 builder; native ARM builds are not validated.

Choose a **new directory** on a volume with enough space. Run from the public
repository root, replacing `/path/on/large-disk` with your own storage location:

```bash
python3 scripts/prepare_agent_build.py \
  --instance vuetifyjs__vuetify-22850 \
  --output /path/on/large-disk/vuetify-22850-build

docker build --platform=linux/amd64 \
  -t swe-bench-interact-local:vuetifyjs__vuetify-22850 \
  /path/on/large-disk/vuetify-22850-build/context
```

The helper checks the recipe hash, verifies the fetched commit, and creates the
Dockerfile and `base/` context. Git objects and the intermediate archive stay
outside that context. Overlay recipes need no source fetch. Existing output
directories are refused; failures preserve partial work for diagnosis. The
helper never starts a container build, installs project dependencies on the
host, or deletes existing files.

Submodules and LFS pointers cause a clear failure instead of an incomplete
context. `git archive` honors upstream `export-ignore` attributes, matching the
original context preparation. Review any such exclusions if investigating a
build failure. Use the published image when an upstream asset is unavailable.

## Reproducibility and evaluation limits

Rebuilding needs network access for upstream source, base images, packages, and
sometimes browsers. Mutable base-image tags, package repositories, lifecycle
scripts, timestamps, and architecture can change the result. A successful local
build is not evidence that it has the published digest. Keep local image tags
separate from the released references; use the published digest when comparing
benchmark results.

Configure Docker's image storage and build cache on an adequately sized volume.
Source archives, dependencies, caches, and built images do not belong in Git.
On managed servers, use the operator's configured storage and build locking.

These recipes do not add hidden benchmark tests or reference solutions to the
Agent workspace. Upstream repositories may already contain their ordinary test
suites. Official scoring still requires the private evaluation materials;
see [EVALUATION.md](EVALUATION.md). This release provides no hosted evaluation
service. Contact the maintainers to arrange evaluation access.
