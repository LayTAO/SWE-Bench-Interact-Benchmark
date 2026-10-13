#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');

const [stdoutPath, evaluatorPath, outputPath, statusText] = process.argv.slice(2);
const commandExitCode = Number(statusText);
if (commandExitCode !== 0 && commandExitCode !== 1) process.exit(1);
const bytes = fs.readFileSync(stdoutPath);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, 'utf8'));
const selected = [...evaluator.FAIL_TO_PASS, ...evaluator.PASS_TO_PASS];
const suiteName = '<Modal>';
const selectedPrefix = `${suiteName} > `;
if (selected.length !== 2 || selected.some(name => !name.startsWith(selectedPrefix))) {
  throw new Error('Unexpected Accepted Modal assertion selection');
}

const lines = bytes.toString('utf8')
  .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
  .split(/\r?\n/);
let suiteLine = null;
let inSuite = false;
let completeLine = null;
const observed = new Map(selected.map(name => [name, []]));
for (let index = 0; index < lines.length; index++) {
  const line = lines[index];
  // The failed-test footer repeats suite names; it is not a second run.
  if (line.trim() === 'FAILED TESTS:') break;
  if (/^✔ \d+ tests completed$/.test(line.trim())) completeLine = index + 1;
  if (line === `  ${suiteName}`) {
    if (suiteLine !== null) throw new Error('Duplicate top-level Modal suite');
    suiteLine = index + 1;
    inSuite = true;
    continue;
  }
  if (!inSuite) continue;
  // Karma server diagnostics can interleave with Mocha's indented suite tree.
  // They are not assertion lines and do not end the current suite.
  if (/^\d{2} \d{2} \d{4} .*:(?:WARN|ERROR) \[[^\]]+\]:/.test(line)) continue;
  if (line.trim() && /^ {0,2}\S/.test(line)) {
    inSuite = false;
    continue;
  }
  const assertion = line.match(/^    ([✔✖]) (.+)$/);
  if (!assertion) continue;
  const fullName = `${selectedPrefix}${assertion[2]}`;
  if (observed.has(fullName)) {
    observed.get(fullName).push({
      fullName,
      status: assertion[1] === '✔' ? 'passed' : 'failed',
      source_line: index + 1,
      source_text: line,
    });
  }
}

// A suite exit status cannot substitute for either selected test. Retain no
// synthetic result when the Mocha reporter omitted or duplicated one.
if (suiteLine === null || completeLine === null ||
    selected.some(name => observed.get(name).length !== 1)) {
  process.exit(1);
}
const selectedStatuses = selected.map(name => observed.get(name)[0].status);
if ((commandExitCode === 0 && selectedStatuses.includes('failed')) ||
    (commandExitCode === 1 && !selectedStatuses.includes('failed'))) {
  process.exit(1);
}
const result = `${JSON.stringify({
  assertionSource: 'karma-mocha-lines',
  selected_assertion_inference: false,
  command_exit_code: commandExitCode,
  stdout_sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  suite: suiteName,
  suite_line: suiteLine,
  complete_line: completeLine,
  testResults: [{
    testFile: 'karma-mocha:<Modal>',
    assertionResults: selected.map(name => observed.get(name)[0]),
  }],
}, null, 2)}\n`;
if (outputPath === '-') process.stdout.write(result);
else fs.writeFileSync(outputPath, result);
