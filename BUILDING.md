# Agent environment guide

## Distribution model

This release separates three artifacts: a digest-pinned image for executing a
task, a Dockerfile describing its environment recipe, and a source-context helper
for reconstructing that recipe's inputs. Container image layers are hosted in
the registry named by the task record. Git contains the references and recipes,
not image archives, dependency directories, or build caches.

Use the digest in `task.json` to run the released environment. The Dockerfiles
document the Agent environment recipes in the authoring repository at the time
of this addition. They have not all been rebuilt as part of this public release;
`builds.json` records this explicitly. A recipe checksum identifies its text, not
proof that rebuilding it reproduces the released image digest.

## 1. Verify the release files

From an unmodified release checkout, verify the file manifest before using the
build inputs. On Linux:

```bash
sha256sum --check MANIFEST.sha256
```

On macOS:

```bash
shasum -a 256 --check MANIFEST.sha256
```

The manifest covers the released files other than itself; it is an integrity
inventory, not a signed provenance statement. See [TASK_FORMAT.md](TASK_FORMAT.md)
for a cross-file consistency check. An anonymous mirror may replace text in
files, including Dockerfiles or registry references, so checksums of its
transformed content may differ from those of the unmodified release. Do not
disable hash verification or silently replace a missing digest with a tag.

## 2. Pull the released image

From the repository root, with Python 3 and Docker installed:

```bash
python3 scripts/pull_agent_images.py --instance vuetifyjs__vuetify-22850
```

The immutable reference is in `tasks/<instance_id>/task.json` under
`agent_environment.image`. Read `instruction.md` for the problem statement.
The source workspace is `/workspace/repo` inside the image. Apply the resource
and time limits from the task metadata when running an Agent. The pull helper
downloads images only; it does not run an Agent or score patches.

Select multiple instances by repeating `--instance`. Downloading the whole
cohort requires an explicit request:

```bash
python3 scripts/pull_agent_images.py --all
```

The helper stops on a failed pull. If the registry reports an authorization,
rate-limit, or missing-manifest error, keep the exact error and image digest for
diagnosis; a locally rebuilt image should not silently replace the frozen image
in a benchmark comparison. Registry reachability and authorization are separate
from the existence of a valid-looking reference in JSON.

## 3. Integrate the environment with an agent

The project directory inside the image is `/workspace/repo`. A runner must
provide the instruction, preserve the base revision, enforce `task.json`
resource limits, and arrange writable storage for patch artifacts. Starting a
container alone does not supply browser automation, an agent implementation,
or the private evaluator.

Use an isolated worker for untrusted generated code. Do not mount host SSH
keys, cloud credentials, or a container-engine socket into an Agent environment.
Provision browser access and networking according to the declared experimental
policy. The release does not provide a general-purpose launcher because those
choices depend on the execution framework.

## 4. Understand the build recipes

There are 103 Agent Dockerfiles in `tasks/*/environment/Dockerfile`,
matching the paper cohort in `cohort.json`:

- 100 recipes copy `base/` into `/workspace/repo`. The helper fetches the task's
  exact base commit and exports it with `git archive`, without upstream history.
- Three recipes overlay an existing Agent image: `ariakit__ariakit-1652`,
  `mui__material-ui-45301`, and `radix-ui__primitives-4014`. Their source and
  dependencies are inherited from the digest-pinned `FROM` image. These are
  **not standalone from-source recipes**; their parent images must be available.

`builds.json` lists each recipe's mode, SHA-256, parent images, and verification
status. Some recipes use `INSTALL_COMMIT` instead of `BASE_COMMIT`; the exporter
checks that either declaration agrees with the task's base commit.

## 5. Prepare and build one task

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

The prepared output includes `context/` and a `build-inputs.json` provenance
record. For source recipes, the temporary bare repository and source archive
remain outside `context/`; they are not part of the image's build context. Keep
the preparation record when investigating a local reconstruction, and keep all
generated materials outside the public Git checkout.

Submodules and LFS pointers cause a clear failure instead of an incomplete
context. `git archive` honors upstream `export-ignore` attributes, matching the
original context preparation. Review any such exclusions if investigating a
build failure. Use the published image when an upstream asset is unavailable.

## Reproducibility and storage

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

## Troubleshooting

- **Unknown instance:** use the exact identifier in `cohort.json`; source-project
  names and issue numbers alone are not accepted by the helpers.
- **Existing output directory:** choose a new preparation path. The helper
  preserves existing or partial outputs instead of overwriting them.
- **Dockerfile checksum mismatch:** check whether the file was edited or
  transformed by an anonymizing mirror. Compare against the exact source
  release before preparing a build.
- **Upstream commit cannot be fetched:** check repository access and commit
  availability. Do not substitute the upstream default branch or a newer commit.
- **Unsupported submodule or LFS input:** preparation stops rather than
  constructing an incomplete source tree. The helper does not implement these
  source-materialization workflows.
- **Architecture or dependency failure:** inspect the recipe, build platform,
  and external service availability. Building all 103 recipes successfully on
  every host architecture is not a claim made by this release.
- **A patch appears correct but has no official score:** environment preparation
  and evaluation are separate. Follow [EVALUATION.md](EVALUATION.md); the public
  pull and build scripts do not run the hidden checks.
