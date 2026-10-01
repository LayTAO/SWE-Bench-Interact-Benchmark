#!/usr/bin/env python3
"""Pull immutable Agent images referenced by the public task index."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--instance", action="append", dest="instances")
    selection.add_argument("--all", action="store_true")
    parser.add_argument("--engine", choices=("docker", "podman"), default="docker")
    args = parser.parse_args()

    if shutil.which(args.engine) is None:
        parser.error(f"{args.engine!r} is not installed or not on PATH")

    root = Path(__file__).resolve().parents[1]
    records = [json.loads(line) for line in (root / "tasks.jsonl").read_text().splitlines()]
    wanted = {record["instance_id"] for record in records} if args.all else set(args.instances)
    known = {record["instance_id"] for record in records}
    unknown = sorted(wanted - known)
    if unknown:
        parser.error(f"unknown instance(s): {', '.join(unknown)}")

    for record in records:
        if record["instance_id"] not in wanted:
            continue
        image = record["agent_environment"]["image"]
        print(f"Pulling {record['instance_id']}: {image}", flush=True)
        subprocess.run([args.engine, "pull", image], check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
