#!/usr/bin/env python3
"""Prepare one Agent build context; Python 3.12+, Git, no container daemon required."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shlex
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path


def prepare(root: Path, instance: str, output: Path) -> Path:
    if not re.fullmatch(r"[A-Za-z0-9_.-]+__[A-Za-z0-9_.-]+-[0-9]+", instance):
        raise ValueError("Invalid instance identifier")
    task = json.loads((root / "tasks" / instance / "task.json").read_text())
    build = json.loads((root / "builds.json").read_text())[instance]
    recipe = root / "tasks" / instance / "environment" / "Dockerfile"
    digest = hashlib.sha256(recipe.read_bytes()).hexdigest()
    if digest != build["dockerfile_sha256"]:
        raise ValueError("Dockerfile checksum mismatch")
    mode = build["mode"]
    if mode not in ("source", "image-overlay"):
        raise ValueError("Unsupported build mode")
    commit = task["repository"]["base_commit"]
    if not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("Invalid base commit")
    url = task["repository"]["url"]
    if not re.fullmatch(r"https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?", url):
        raise ValueError("Expected a public GitHub HTTPS repository URL")
    output = output.absolute()
    # Refuse even an empty existing directory or symlink. Failed work is retained.
    output.mkdir(parents=True, exist_ok=False)
    context = output / "context"
    context.mkdir()
    shutil.copyfile(recipe, context / "Dockerfile")
    (context / ".dockerignore").write_text("**/.git\n")

    if mode == "source":
        checkout = output / "upstream.git"
        subprocess.run(["git", "init", "--bare", str(checkout)], check=True)
        subprocess.run(["git", "-C", str(checkout), "fetch", "--depth=1", "--no-tags", url, commit], check=True)
        actual = subprocess.check_output(
            ["git", "-C", str(checkout), "rev-parse", "FETCH_HEAD^{commit}"], text=True
        ).strip()
        if actual != commit:
            raise ValueError("Fetched commit does not match task base")
        # git archive matches the original build-context recipe and omits history.
        # Submodule contents and LFS objects cannot be silently replaced by pointers.
        entries = subprocess.check_output(["git", "-C", str(checkout), "ls-tree", "-r", commit])
        if any(line.startswith(b"160000 ") for line in entries.splitlines()):
            raise ValueError("Submodules require explicit materialization; use the frozen image")
        archive = output / "base.tar"
        subprocess.run(["git", "-C", str(checkout), "archive", "--format=tar", f"--output={archive}", commit], check=True)
        base = context / "base"
        base.mkdir()
        with tarfile.open(archive) as handle:
            handle.extractall(base, filter="data")
        for path in base.rglob("*"):
            if path.is_file() and not path.is_symlink() and path.stat().st_size < 1024:
                if path.read_bytes().startswith(b"version https://git-lfs.github.com/spec/v1"):
                    raise ValueError("LFS pointers require explicit materialization; use the frozen image")

    (output / "build-inputs.json").write_text(json.dumps({
        "instance_id": instance,
        "base_commit": commit,
        "dockerfile_sha256": digest,
        "mode": mode,
        "reference_image": task["agent_environment"]["image"],
        "from_images": build["from_images"],
    }, indent=2) + "\n")
    return context


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--instance", required=True)
    parser.add_argument("--output", type=Path, required=True, help="new directory on a disk with sufficient space")
    args = parser.parse_args()
    if sys.version_info < (3, 12):
        parser.error("Python 3.12 or newer is required for safe archive extraction")
    root = Path(__file__).resolve().parents[1]
    try:
        context = prepare(root, args.instance, args.output)
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError, tarfile.TarError) as error:
        print(f"Preparation failed: {error}. Any partial output is preserved.", file=sys.stderr)
        return 1
    print(f"Prepared context: {context}")
    print("Build explicitly with Docker BuildKit (requires network and disk space):")
    print(shlex.join(["docker", "build", "--platform=linux/amd64", "-t", f"swe-bench-interact-local:{args.instance}", str(context)]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
