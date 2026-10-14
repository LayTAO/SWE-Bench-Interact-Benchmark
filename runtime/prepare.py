#!/usr/bin/env python3
"""Prepare standalone Harbor build contexts from exact upstream base revisions."""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tarfile
from pathlib import Path, PurePosixPath


def member(root: Path, name: str) -> Path:
    relative = PurePosixPath(name)
    if relative.is_absolute() or '..' in relative.parts or '\\' in name:
        raise ValueError(f'Unsafe material path: {name}')
    path = root.joinpath(*relative.parts)
    if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError(f'Material escapes release: {name}')
    return path


def prepare(root: Path, output: Path, instances=None, source_provider=None) -> dict:
    from validate import validate
    from source import fetch_base
    validate(root)
    cohort = json.loads((root / 'cohort.json').read_text())
    selected = cohort['instance_ids'] if instances is None else instances
    if not selected or len(selected) != len(set(selected)) or not set(selected) <= set(cohort['instance_ids']):
        raise ValueError('Select unique task IDs from cohort.json')
    if output.exists():
        raise ValueError('Choose a new output directory; existing files are preserved')
    if output.resolve().is_relative_to(root.resolve()):
        raise ValueError('Build contexts must be outside the release repository')
    output.mkdir(parents=True)
    shutil.copytree(root / 'runtime', output / 'runtime', ignore=shutil.ignore_patterns('__pycache__'))
    records = {row['instance_id']: row for row in
               map(json.loads, (root / 'tasks.jsonl').read_text().splitlines())}
    inputs = {}
    for instance in selected:
        source = root / 'tasks' / instance
        task = output / 'tasks' / instance
        task.mkdir(parents=True)
        for name in ('instruction.md', 'task.toml'):
            shutil.copyfile(source / name, task / name)
        for name in ('environment', 'tests'):
            (task / name).mkdir()
            for file in ('Dockerfile', '.dockerignore'):
                shutil.copyfile(source / name / file, task / name / file)
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
        # Recreate archive inputs exclusively from the screened public files.
        recipe = (task / 'tests/Dockerfile').read_text()
        for directory in ('canonical_repro', 'verifier'):
            if f'COPY {directory}.tar ' in recipe:
                with tarfile.open(task / 'tests' / f'{directory}.tar', 'w') as archive:
                    archive.add(task / 'tests' / directory, arcname=directory)
        base, receipt = (source_provider or fetch_base)(records[instance], output / '.sources' / instance)
        inputs[instance] = receipt
        for directory in ('environment', 'tests'):
            shutil.copytree(base, task / directory / 'base', symlinks=True)
            context = task / directory
            for line in (context / 'Dockerfile').read_text().splitlines():
                if line.startswith('COPY ') and not line.startswith('COPY --from='):
                    path = line.split()[1].rstrip('/')
                    if not (context / path).exists():
                        raise ValueError(f'Missing build input: {instance}/{directory}/{path}')
        print(f'Prepared {instance}', flush=True)
    (output / 'cohort.json').write_text(json.dumps({**cohort, 'instance_ids': selected,
        'expected_count': len(selected), 'full_cohort_count': len(cohort['instance_ids'])}, indent=2) + '\n')
    (output / 'build-inputs.json').write_text(json.dumps(inputs, indent=2) + '\n')
    (output / 'runtime/prepared.json').write_text(json.dumps({
        'cohort': cohort['release_id'], 'tasks': len(selected), 'distribution': 'source-build',
        'source_manifest_sha256': hashlib.sha256((root / 'MANIFEST.sha256').read_bytes()).hexdigest(),
    }, indent=2) + '\n')
    job = json.loads((root / 'job.example.json').read_text())
    job['datasets'] = [{'path': str((output / 'tasks').resolve())}]
    (output / 'job.json').write_text(json.dumps(job, indent=2) + '\n')
    return {'tasks': len(selected), 'output': str(output), 'images_built': 0,
            'build_on_harbor_start': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument('--instance', action='append', help='repeat for multiple tasks')
    selection.add_argument('--all', action='store_true', help='fetch and prepare all 103 tasks')
    args = parser.parse_args()
    print(json.dumps(prepare(Path(__file__).resolve().parents[1], args.output.resolve(),
                             args.instance), indent=2))
