#!/usr/bin/env python3
"""Materialize content-deduplicated Harbor tasks; never build an image."""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path, PurePosixPath


def member(root: Path, name: str) -> Path:
    relative = PurePosixPath(name)
    if relative.is_absolute() or '..' in relative.parts or '\\' in name:
        raise ValueError(f'Unsafe material path: {name}')
    path = root.joinpath(*relative.parts)
    if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError(f'Material escapes release: {name}')
    return path


def prepare(root: Path, output: Path) -> dict:
    from validate import validate
    validate(root)
    if output.exists():
        raise ValueError('Choose a new output directory; existing files are preserved')
    output.mkdir(parents=True)
    shutil.copytree(root / 'runtime', output / 'runtime', ignore=shutil.ignore_patterns('__pycache__'))
    cohort = json.loads((root / 'cohort.json').read_text())
    for instance in cohort['instance_ids']:
        source = root / 'tasks' / instance
        task = output / 'tasks' / instance
        task.mkdir(parents=True)
        for name in ('instruction.md', 'task.toml'):
            shutil.copyfile(source / name, task / name)
        for name in ('environment', 'tests'):
            (task / name).mkdir()
        shutil.copyfile(source / 'environment/docker-compose.yaml', task / 'environment/docker-compose.yaml')
        materials = json.loads((source / 'tests/materials.json').read_text())
        mounts = []
        for relative, entry in materials.items():
            blob = member(root, entry['source'])
            data = blob.read_bytes()
            if hashlib.sha256(data).hexdigest() != entry['sha256']:
                raise ValueError(f'Checksum mismatch: {instance}/{relative}')
            destination = member(task / 'tests', relative)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
            destination.chmod(entry['mode'])
            # File mounts preserve dependencies already installed below /tests.
            mounts.append({'type': 'bind', 'source': './' + relative,
                           'target': '/tests/' + relative, 'read_only': True,
                           'bind': {'create_host_path': False}})
        (task / 'tests/docker-compose.yaml').write_text(json.dumps({
            'services': {'main': {'platform': 'linux/amd64', 'volumes': mounts}}
        }, indent=2) + '\n')
    (output / 'cohort.json').write_text(json.dumps(cohort, indent=2) + '\n')
    (output / 'runtime/prepared.json').write_text(json.dumps({
        'cohort': cohort['release_id'], 'tasks': len(cohort['instance_ids']),
        'source_manifest_sha256': hashlib.sha256((root / 'MANIFEST.sha256').read_bytes()).hexdigest(),
    }, indent=2) + '\n')
    job = json.loads((root / 'job.example.json').read_text())
    job['datasets'] = [{'path': str((output / 'tasks').resolve())}]
    (output / 'job.json').write_text(json.dumps(job, indent=2) + '\n')
    return {'tasks': len(cohort['instance_ids']), 'output': str(output), 'images_built': 0}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(Path(__file__).resolve().parents[1], args.output.resolve()), indent=2))
