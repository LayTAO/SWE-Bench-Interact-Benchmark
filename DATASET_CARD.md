# Dataset card

## Summary

SWE-Bench-Interact evaluates whether software-engineering agents can repair
frontend defects whose symptoms require browser interaction to reproduce and
validate.  Tasks are derived from accepted InteractRepair instances and pair a
history-free upstream base commit with an immutable Agent environment.

## Public fields

Each task exposes its identifier, source project and issue, base commit, cleaned
Agent instruction, resource limits, immutable Agent image digest, test counts,
reproduction category when available, and cryptographic commitments to hidden
evaluation materials.

## Withheld fields

Gold patches, fixed commits, hidden tests, verifier implementation and images,
trajectories, prompts, full logs, and other run artifacts are withheld to reduce
test leakage and benchmark contamination.

## Intended use

The public artifact supports task inspection, Agent-environment reproduction,
and generation of candidate patches.  Official scores require evaluation against
the matching private verifier identified by the published commitments.

## Limitations

- Source issues are public and may contain links or discussion that reveal fixes.
- Public upstream history can make contamination impossible to eliminate fully.
- Withheld evaluation assets limit fully offline reproduction of official scores.
- Container images include third-party code and dependencies under their own
  licenses and may require significant storage.
- The benchmark primarily covers interaction-heavy frontend projects and should
  not be treated as representative of all software-engineering work.

## Versioning

Task and image identities are immutable within a release.  Changes to an
instruction, base commit, image digest, or evaluation commitment require a new
release version.
