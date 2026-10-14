#!/usr/bin/env python3
"""Fetch an exact public base revision and export a history-free build input."""
from __future__ import annotations

import hashlib
import re
import subprocess
import tarfile
from pathlib import Path


def archive_base(url: str, commit: str, work: Path) -> tuple[Path, dict]:
    """Internal Git backend; callers validate the public repository URL."""
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        raise ValueError('Expected a full base commit SHA')
    work.mkdir(parents=True, exist_ok=False)
    checkout, archive, base = work / 'upstream.git', work / 'base.tar', work / 'base'
    subprocess.run(['git', 'init', '--bare', str(checkout)], check=True)
    subprocess.run(['git', '-C', str(checkout), 'fetch', '--depth=1', '--no-tags',
                    url, commit], check=True)
    def git(*args):
        return subprocess.check_output(['git', '-C', str(checkout), *args])
    if git('rev-parse', 'FETCH_HEAD^{commit}').decode().strip() != commit:
        raise ValueError('Fetched revision differs from the frozen base')
    entries = git('ls-tree', '-r', commit).splitlines()
    if any(line.startswith(b'160000 ') for line in entries):
        raise ValueError('Submodules require an explicit source recipe; refusing incomplete input')
    subprocess.run(['git', '-C', str(checkout), 'archive', '--format=tar',
                    f'--output={archive}', commit], check=True)
    base.mkdir()
    with tarfile.open(archive) as handle:
        handle.extractall(base, filter='data')
    for path in base.rglob('*'):
        if '.git' in path.relative_to(base).parts:
            raise ValueError('Git metadata in source archive')
        if path.is_file() and not path.is_symlink() and path.stat().st_size < 1024:
            if path.read_bytes().startswith(b'version https://git-lfs.github.com/spec/v1'):
                raise ValueError('LFS pointer requires explicit materialization; refusing incomplete input')
    with archive.open('rb') as handle:
        digest = hashlib.file_digest(handle, 'sha256').hexdigest()
    return base, {'base_commit': commit, 'source_archive_sha256': digest,
                  'git_tree': git('rev-parse', f'{commit}^{{tree}}').decode().strip()}


def fetch_base(record: dict, work: Path) -> tuple[Path, dict]:
    repository = record['repository']
    url = repository['url']
    if not re.fullmatch(r'https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?', url):
        raise ValueError('Expected a public GitHub HTTPS repository URL')
    return archive_base(url, repository['base_commit'], work)
