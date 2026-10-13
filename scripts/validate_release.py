#!/usr/bin/env python3
"""Check the public release without images, network access or private materials."""

from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from pathlib import Path


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    require(not path.is_symlink(), f"Symlink is not a released file: {path.name}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(root):
    root = Path(root).resolve()
    cohort = json.loads((root / "cohort.json").read_text())
    records = [json.loads(line) for line in (root / "tasks.jsonl").read_text().splitlines()]
    reproductions = [json.loads(line) for line in (root / "reproductions.jsonl").read_text().splitlines()]
    builds = json.loads((root / "builds.json").read_text())
    metadata = json.loads((root / "release-metadata.json").read_text())
    expected = set(cohort["instance_ids"])
    require(len(expected) == len(cohort["instance_ids"]) == cohort["expected_count"] == 103,
            "Cohort must have exactly 103 unique tasks")
    for label, rows in (("task", records), ("reproduction", reproductions)):
        ids = [r["instance_id"] for r in rows]
        require(len(ids) == len(set(ids)) == 103 and set(ids) == expected,
                f"{label} index differs from cohort")
    require(set(builds) == expected, "Build index differs from cohort")
    require({p.name for p in (root / "tasks").iterdir() if p.is_dir()} == expected,
            "Task directories differ from cohort")
    by_id = {r["instance_id"]: r for r in reproductions}
    for record in records:
        instance = record["instance_id"]
        require(record == json.loads((root / "tasks" / instance / "task.json").read_text()),
                f"Per-task record differs: {instance}")
        require(record["schema_version"] == "1.1", f"Unexpected task schema: {instance}")
        require(record["instruction_path"] == f"tasks/{instance}/instruction.md",
                f"Unexpected instruction path: {instance}")
        require((root / record["instruction_path"]).is_file(), f"Missing instruction: {instance}")
        require(re.fullmatch(r"[0-9a-f]{40}", record["repository"]["base_commit"]),
                f"Invalid base revision: {instance}")
        require(re.fullmatch(r".+@sha256:[0-9a-f]{64}", record["agent_environment"]["image"]),
                f"Image is not digest-pinned: {instance}")
        for field in ("f2p_count", "p2p_count"):
            value = record["evaluation"][field]
            require(type(value) is int and value >= 0, f"Invalid {field}: {instance}")
        commitments = record["evaluation"]["commitments"]
        needed = {"gold_patch_sha256", "official_test_patch_sha256", "evaluation_spec_sha256",
                  "evaluation_bundle_sha256", "canonical_repro_tree_sha256"}
        require(needed <= set(commitments), f"Missing evaluation commitments: {instance}")
        require(all(re.fullmatch(r"[0-9a-f]{64}", h) for h in commitments.values()),
                f"Malformed commitment: {instance}")
        repro = by_id[instance]
        require(repro["page_materials_present"] is True and repro["page_source_released"] is False,
                f"Unexpected reproduction disclosure state: {instance}")
        require(repro["runtime_revalidated_in_this_release"] is False,
                f"This metadata release must not claim runtime validation: {instance}")
        require(repro["private_reproduction_bundle_sha256"] == commitments["canonical_repro_tree_sha256"],
                f"Reproduction commitment differs: {instance}")
        require(re.fullmatch(r"[0-9a-f]{64}", repro["page_materials_sha256"]),
                f"Invalid page commitment: {instance}")
        recipe = builds[instance]
        require(recipe["dockerfile"] == f"tasks/{instance}/environment/Dockerfile",
                f"Unexpected build path: {instance}")
        require(digest(root / recipe["dockerfile"]) == recipe["dockerfile_sha256"],
                f"Recipe checksum differs: {instance}")
    require(metadata["tasks"] == 103 and metadata["repositories"] ==
            len({r["repository"]["name"] for r in records}), "Summary count differs")
    require(metadata["coverage"]["declared_f2p_assertion_entries"] ==
            sum(r["evaluation"]["f2p_count"] for r in records), "F2P sum differs")
    require(metadata["coverage"]["declared_p2p_assertion_entries"] ==
            sum(r["evaluation"]["p2p_count"] for r in records), "P2P sum differs")
    require(metadata["coverage"]["reproduction_materialization"] ==
            dict(Counter(r["materialization"] for r in reproductions)), "Page coverage differs")
    require((root / "VERSION").read_text().strip() == metadata["release_version"],
            "Artifact versions disagree")
    named = set()
    for line in (root / "MANIFEST.sha256").read_text().splitlines():
        hash_value, name = line.split("  ", 1)
        path = Path(name)
        require(not path.is_absolute() and ".." not in path.parts and ".git" not in path.parts,
                f"Unsafe manifest path: {name}")
        require(name not in named, f"Duplicate manifest entry: {name}")
        named.add(name)
        require(digest(root / name) == hash_value, f"Checksum mismatch: {name}")
    files = {p.relative_to(root).as_posix() for p in root.rglob("*")
             if p.is_file() and ".git" not in p.relative_to(root).parts
             and "__pycache__" not in p.relative_to(root).parts and p.name != ".DS_Store"}
    require(named == files - {"MANIFEST.sha256"}, "Manifest does not cover exact release")
    return {"validated": True, "tasks": len(records), "repositories": metadata["repositories"],
            "reproduction_page_records": len(reproductions), "manifest_files": len(named),
            "runtime_tests_executed": False, "private_evaluation_materials_required_for_scoring": True}


if __name__ == "__main__":
    print(json.dumps(validate(Path(__file__).resolve().parents[1]), indent=2))
