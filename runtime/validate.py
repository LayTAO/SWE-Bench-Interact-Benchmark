#!/usr/bin/env python3
"""Validate release membership, task definitions, materials and file hashes."""
from __future__ import annotations

import hashlib
import json
import re
import tomllib
from pathlib import Path

from prepare import member


def require(value, message):
    if not value:
        raise ValueError(message)


def validate(root: Path) -> dict:
    root = root.resolve()
    cohort = json.loads((root / 'cohort.json').read_text())
    ids = cohort['instance_ids']
    require(len(ids) == len(set(ids)) == cohort['expected_count'] == 103, 'Expected 103 unique tasks')
    require({p.name for p in (root / 'tasks').iterdir()} == set(ids), 'Task directories differ')
    images = json.loads((root / 'images.lock.json').read_text())
    records = [json.loads(line) for line in (root / 'tasks.jsonl').read_text().splitlines()]
    require(len(records) == 103 and {r['instance_id'] for r in records} == set(ids), 'Index differs')
    require(set(images) == set(ids), 'Image lock differs')
    material_count = 0
    for instance in ids:
        task = root / 'tasks' / instance
        config = tomllib.loads((task / 'task.toml').read_text())
        require(config['metadata']['instance_id'] == instance, 'Task identity differs')
        require(config['verifier']['environment_mode'] == 'separate', 'Expected independent verifier')
        for role, env in [('agent', config['environment']), ('verifier', config['verifier']['environment'])]:
            image = env['docker_image']
            require(re.fullmatch(r'.+@sha256:[0-9a-f]{64}', image), 'Unpinned image')
            require(images[instance][role] == image, 'Image lock differs from task')
        require((task / 'instruction.md').is_file(), 'Missing instruction')
        materials = json.loads((task / 'tests/materials.json').read_text())
        require({'test.sh', 'verifier/evaluator.json', 'verifier/official_test.patch',
                 'verifier/check_patch.cjs', 'verifier/run_canonical.sh'} <= set(materials),
                f'Incomplete evaluator: {instance}')
        for name, entry in materials.items():
            member(task / 'tests', name)
            require('solution' not in Path(name).parts and not name.endswith('gold.patch'),
                    f'Reference repair in materials: {instance}')
            blob = member(root, entry['source'])
            require(entry['mode'] in (0o644, 0o755), 'Unexpected file mode')
            require(hashlib.sha256(blob.read_bytes()).hexdigest() == entry['sha256'], 'Material hash differs')
            material_count += 1
        evaluator = json.loads(member(root, materials['verifier/evaluator.json']['source']).read_text())
        require(isinstance(evaluator['FAIL_TO_PASS'], list) and isinstance(evaluator['PASS_TO_PASS'], list),
                'Missing test selections')
    named = set()
    for line in (root / 'MANIFEST.sha256').read_text().splitlines():
        digest, name = line.split('  ', 1)
        require(name not in named, 'Duplicate manifest entry')
        named.add(name)
        require(hashlib.sha256(member(root, name).read_bytes()).hexdigest() == digest, f'Hash mismatch: {name}')
    actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()
              and not set(p.relative_to(root).parts) & {'.git', '__pycache__'}
              and p.name not in {'.DS_Store', 'MANIFEST.sha256'}}
    require(named == actual, 'Manifest does not cover exact release')
    return {'tasks': len(ids), 'material_references': material_count, 'static_validation': 'passed',
            'container_execution_checked': False}


if __name__ == '__main__':
    print(json.dumps(validate(Path(__file__).resolve().parents[1]), indent=2))
