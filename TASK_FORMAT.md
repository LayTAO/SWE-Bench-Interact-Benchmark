# Public task and artifact format

## Scope

This document specifies the data files in the public task-and-environment
release. The format is independent of any particular agent runner. It is not a
Harbor configuration schema and does not expose the private verifier interface.

JSON files are UTF-8. `tasks.jsonl` contains one JSON object per nonempty line;
the record for an instance is identical in content to
`tasks/<instance_id>/task.json`. Consumers should join records by `instance_id`,
not by line number or directory traversal order.

## Task identity and source

- `schema_version`: public task-record schema version, currently the string
  `"1.0"`. This is distinct from the artifact version in `VERSION`.
- `instance_id`: stable instance identifier, for example
  `vuetifyjs__vuetify-22850`. Use the record's repository fields for upstream URLs
  rather than reconstructing them by splitting this identifier.
- `source`: provenance fields `benchmark`, `benchmark_version`, `track`,
  `source_id`, and `status`. A source ID is not an issue number. The current
  cohort is marked accepted in the InteractRepair 4.0 interaction track.
- `repository.name` and `repository.url`: upstream project identity and source
  repository location.
- `repository.issue_number` and `repository.issue_url`: issue identity and
  provenance. The released instruction defines the agent-visible task.
- `repository.base_commit`: full 40-character Git commit identifier specifying
  the source revision against which the repair is made.
- `instruction_path`: path to the instruction, relative to the release root.

## Agent environment

`agent_environment` describes the intended task runtime:

- `image`: container image reference pinned with `@sha256:<digest>`. This is an
  Agent image reference, not a verifier image or an archive in this repository.
- `os`: operating-system target; the current release specifies `linux`.
- `cpus`: requested CPU allocation.
- `memory_mb`: task memory limit in MB.
- `storage_mb`: task storage limit in MB; not the compressed image size.
- `timeout_sec`: agent time budget in seconds; numeric values may be represented
  as floating-point numbers in JSON.
- `network_mode`: network-policy metadata. The current value is `public`;
  mapping it to container and agent-tool policies is the runner's responsibility.

The container workspace is `/workspace/repo`. Reading a JSON record or pulling
its image does not apply these limits. A runner must provision storage, enforce
resource and time budgets, supply the instruction, and collect the final patch.

## Optional evaluation metadata

`evaluation.reproduction_type` identifies the reproduction category when known.
`evaluation.f2p_count` and `evaluation.p2p_count` describe the numbers of
fail-to-pass and pass-to-pass tests when those counts are exported.

`evaluation.commitments` maps available asset names to SHA-256 values. Possible
keys include `base_codebase_sha256`, `upstream_lockfile_sha256`,
`gold_patch_sha256`, `official_test_patch_sha256`, `canonical_playwright_sha256`,
`canonical_repro_tree_sha256`, `canonical_tree_sha256`, and
`canonical_validation_sha256`. Presence depends on the available source metadata.
A hash identifies an asset under its preparation procedure; it does not reveal
the asset or establish that an evaluation was performed correctly.

**Missingness is meaningful.** A `null` count is unknown, not zero. An empty
commitment object means that no commitments were exported for that task, not
that it lacks private evaluation materials. Current coverage is documented in
[DATASET_CARD.md](DATASET_CARD.md). Consumers must tolerate these values.

## Cohort membership

`cohort.json` contains `schema_version`, `release_id`, `expected_count`, and
`instance_ids`. The current `release_id` is `paper-103` and `expected_count` is
103. The identifier list has no duplicates. It must match the instance sets in
`tasks.jsonl`, `builds.json`, and the `tasks/` directory.

Membership is explicit: scanning a larger collection, selecting all images in
a registry, or following upstream issue links does not define this release.

## Build index

`builds.json` is an object keyed by `instance_id`. Each entry contains:

- `dockerfile`: path to the recipe relative to the release root.
- `dockerfile_sha256`: SHA-256 of the recipe's released bytes.
- `mode`: `source` when preparation exports the exact upstream base revision to
  `context/base/`, or `image-overlay` when the recipe inherits an Agent image.
- `from_images`: parent image references appearing in the recipe. A parent may
  use a mutable tag even though the final released Agent image is digest-pinned.
- `rebuild_verified`: whether a release rebuild has been verified; this is
  `false` for all current entries. It is not the task acceptance status.

The preparation helper checks the Dockerfile hash before creating a context.
It does not establish byte-for-byte equivalence with a released container image.

## Consistency check

The following read-only check compares the index, membership, per-task records,
and Dockerfile hashes. Run it from an unmodified release root:

```bash
python3 - <<'PY'
import hashlib
import json
from pathlib import Path

root = Path(".")
cohort = json.loads((root / "cohort.json").read_text())
records = [json.loads(line) for line in (root / "tasks.jsonl").read_text().splitlines()]
builds = json.loads((root / "builds.json").read_text())
ids = [record["instance_id"] for record in records]
assert len(ids) == len(set(ids)) == cohort["expected_count"] == 103
assert len(cohort["instance_ids"]) == len(set(cohort["instance_ids"])) == 103
assert set(ids) == set(cohort["instance_ids"]) == set(builds)
assert set(ids) == {p.name for p in (root / "tasks").iterdir() if p.is_dir()}
for record in records:
    instance = record["instance_id"]
    assert record == json.loads((root / "tasks" / instance / "task.json").read_text())
    assert (root / record["instruction_path"]).is_file()
    recipe = builds[instance]
    digest = hashlib.sha256((root / recipe["dockerfile"]).read_bytes()).hexdigest()
    assert digest == recipe["dockerfile_sha256"]
print("Validated 103 task records, instructions, and Dockerfile hashes.")
PY
```

For all released file bytes, also verify `MANIFEST.sha256` using the commands in
[BUILDING.md](BUILDING.md). These checks establish internal consistency, not
image accessibility, evaluation correctness, or the provenance of an untrusted
download. Text replacement by an anonymizing mirror may invalidate hashes of
transformed files and must be distinguished from changes to the source release.
