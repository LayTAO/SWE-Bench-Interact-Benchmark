const fs = require('node:fs');
const path = require('node:path');
const [directory, mode] = process.argv.slice(2);
if (!directory || !['buggy', 'fixed', 'patched'].includes(mode)) process.exit(2);
let observation, report;
try {
  observation = JSON.parse(fs.readFileSync(path.join(directory, 'observation.json')));
  report = JSON.parse(fs.readFileSync(path.join(directory, 'playwright.json')));
} catch (error) { console.error('Missing or invalid canonical evidence:', error.message); process.exit(1); }
const tests = [];
(function walk(suites) { for (const suite of suites || []) { for (const spec of suite.specs || []) tests.push(...(spec.tests || [])); walk(suite.suites); } })(report.suites);
const executed = tests.length > 0 && tests.every(test => test.results?.length === 1 && test.results[0].status === 'passed');
const rows = observation.cases || [observation];
const healthy = rows.length === tests.length && rows.every(row => row.environment_valid === true && row.rendering_valid === true && row.trigger_valid === true && Array.isArray(row.page_errors) && row.page_errors.length === 0 && row.action_error === null && row.bug_observed === (mode === 'buggy'));
fs.writeFileSync(path.join(directory, 'canonical-evidence.json'), JSON.stringify({ mode, executed_test_count: tests.length, tests_passed: executed, observation_valid: healthy, resolved: executed && healthy }, null, 2) + '\n');
if (!executed || !healthy) process.exit(1);
