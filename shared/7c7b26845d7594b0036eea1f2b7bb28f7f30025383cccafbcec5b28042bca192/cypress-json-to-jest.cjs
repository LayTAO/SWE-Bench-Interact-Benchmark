const fs = require('fs');
const input = fs.readFileSync(process.argv[2], 'utf8');
const isMochaResult = value => value
  && Array.isArray(value.tests)
  && Array.isArray(value.passes)
  && Array.isArray(value.failures);
const decoderCandidates = [];
for (let i = 0; i < input.length; i++) {
  if (input[i] !== '{') continue;
  try {
    const value = JSON.parse(input.slice(i));
    if (isMochaResult(value)) decoderCandidates.push(value);
  } catch (_) {}
}
// Cypress may append non-JSON output. Scan balanced object suffixes as a fallback.
if (!decoderCandidates.length) {
  for (let start = 0; start < input.length; start++) {
    if (input[start] !== '{') continue;
    let depth = 0, quoted = false, escaped = false;
    for (let end = start; end < input.length; end++) {
      const ch = input[end];
      if (quoted) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') quoted = false;
      } else if (ch === '"') quoted = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        try {
          const value = JSON.parse(input.slice(start, end + 1));
          if (isMochaResult(value)) decoderCandidates.push(value);
        } catch (_) {}
        break;
      }
    }
  }
}
if (!decoderCandidates.length) throw new Error('Cypress output did not contain Mocha JSON');
const mocha = decoderCandidates[decoderCandidates.length - 1];
const names = values => new Set(values.map(test => test.fullTitle));
const passedNames = names(mocha.passes || []);
const failedNames = names(mocha.failures || []);
const pendingNames = names(mocha.pending || []);
const assertionResults = (mocha.tests || []).map(test => ({
  ancestorTitles: [], title: test.title, fullName: test.fullTitle,
  status: passedNames.has(test.fullTitle) ? 'passed'
    : failedNames.has(test.fullTitle) ? 'failed'
    : pendingNames.has(test.fullTitle) ? 'pending' : 'failed',
  duration: test.duration ?? null,
  failureMessages: failedNames.has(test.fullTitle) ? [test.err?.message || ''] : [],
}));
const passed = assertionResults.filter(test => test.status === 'passed').length;
const failed = assertionResults.filter(test => test.status === 'failed').length;
fs.writeFileSync(process.argv[3], JSON.stringify({
  success: failed === 0,
  numTotalTests: assertionResults.length,
  numPassedTests: passed,
  numFailedTests: failed,
  numPendingTests: assertionResults.length - passed - failed,
  testResults: [{name: 'Cypress component test', status: failed ? 'failed' : 'passed', assertionResults}],
}, null, 2));
