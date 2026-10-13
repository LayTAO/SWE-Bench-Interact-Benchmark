#!/usr/bin/env python3
import json
import sys

path, mode, expected_text = sys.argv[1:]
data = json.load(open(path, encoding='utf-8'))
expected = expected_text == 'true'
checks = {
    'mode': data.get('mode') == mode,
    'workers': data.get('workers') == 1,
    'retries': data.get('retries') == 0,
    'environment': data.get('environment_valid') is True,
    'trigger': data.get('trigger_valid') is True,
    'no_action_error': data.get('action_error') is None,
    'predicate': data.get('bug_observed') is expected,
}
failed = [name for name, passed in checks.items() if not passed]
if failed:
    raise SystemExit('canonical reproduction validation failed: ' + ', '.join(failed))
