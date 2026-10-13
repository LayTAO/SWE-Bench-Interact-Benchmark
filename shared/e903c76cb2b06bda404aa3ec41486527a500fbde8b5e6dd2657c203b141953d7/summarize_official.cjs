const fs = require('fs');

const [rawPath, evaluatorPath, outputPath, statusText, nonce] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, 'utf8'));
let raw = null;
try { raw = JSON.parse(fs.readFileSync(rawPath, 'utf8')); } catch (_) {}
const trusted = raw && raw.assertionSource === 'karma-onSpecComplete' &&
  typeof nonce === 'string' && nonce.length === 32 && raw.runNonce === nonce &&
  raw.selected_assertion_inference !== true &&
  Array.isArray(raw.testResults) && raw.testResults.length === 1 &&
  Array.isArray(raw.testResults[0].assertionResults) &&
  raw.numTotalTests === raw.testResults[0].assertionResults.length;
const assertions = trusted ? raw.testResults[0].assertionResults : [];
const normalize = name => String(name).replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ').trim();
function selected(names) {
  const matches = [];
  for (const expected of names) {
    const expectedName = normalize(expected);
    const found = assertions.filter(item => {
      const actualName = normalize(item.fullName);
      return actualName === expectedName || actualName.endsWith(` ${expectedName}`);
    });
    matches.push({expected, actual: found.length === 1 ? found[0].fullName : null,
      status: found.length === 1 ? found[0].status : found.length ? 'ambiguous' : 'missing',
      match_count: found.length});
  }
  const passed = matches.filter(item => item.match_count === 1 && item.status === 'passed').length;
  return {summary: {passed, failed: names.length - passed, total: names.length}, matches};
}
const f2p = selected(evaluator.FAIL_TO_PASS);
const p2p = selected(evaluator.PASS_TO_PASS);
const commandOk = Number(statusText) === 0;
const resolved = Boolean(trusted && commandOk && f2p.summary.failed === 0 &&
  p2p.summary.failed === 0 && f2p.summary.total > 0 && p2p.summary.total > 0);
fs.writeFileSync(outputPath, `${JSON.stringify({
  phase: 'official-tests', exit_code: Number(statusText), resolved,
  assertion_source: trusted ? raw.assertionSource : 'missing_or_untrusted_per_spec_report',
  raw_test_count: trusted ? assertions.length : null,
  FAIL_TO_PASS: f2p.summary, PASS_TO_PASS: p2p.summary,
  selected_assertions: {FAIL_TO_PASS: f2p.matches, PASS_TO_PASS: p2p.matches},
}, null, 2)}\n`);
process.exit(resolved ? 0 : 1);
