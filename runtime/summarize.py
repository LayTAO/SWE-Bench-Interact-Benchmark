#!/usr/bin/env python3
"""Summarize a single Harbor job, counting each task exactly once."""
import argparse
import json
from pathlib import Path


def summarize(job: Path) -> dict:
    rows = []
    seen = set()
    for file in sorted(job.glob('*/result.json')):
        result = json.loads(file.read_text())
        task = result.get('task_name')
        if not task:
            continue
        if task in seen:
            raise ValueError(f'Multiple attempts for {task}; select one attempt per task first')
        seen.add(task)
        reward = (result.get('verifier_result') or {}).get('rewards', {}).get('reward')
        if reward not in (0, 1, None):
            raise ValueError(f'Unexpected reward for {task}: {reward}')
        rows.append({'task': task, 'reward': reward})
    total = len(rows)
    resolved = sum(row['reward'] == 1 for row in rows)
    return {'tasks': total, 'resolved': resolved,
            'resolved_percent': round(100 * resolved / total, 2) if total else None,
            'reward_0': sum(row['reward'] == 0 for row in rows),
            'without_reward': sum(row['reward'] is None for row in rows), 'results': rows}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('job', type=Path)
    print(json.dumps(summarize(parser.parse_args().job), indent=2))
