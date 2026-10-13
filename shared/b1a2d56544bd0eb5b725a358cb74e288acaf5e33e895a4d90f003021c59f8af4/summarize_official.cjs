const fs = require('fs');
const crypto = require('crypto');

const [rawPath, evaluatorPath, outputPath, statusText, nonce, controlsPath] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, 'utf8'));
let raw = null;
try { raw = JSON.parse(fs.readFileSync(rawPath, 'utf8')); } catch (_) {}
let controlsContract = null;
let controlsHash = null;
try {
  const bytes = fs.readFileSync(controlsPath);
  controlsContract = JSON.parse(bytes);
  controlsHash = crypto.createHash('sha256').update(bytes).digest('hex');
} catch (_) {}
// The Accepted gold run contains 59 actual Jasmine specs: one added F2P and
// 58 unchanged upstream controls. evaluator.PASS_TO_PASS names that control
// *group*, not an executable testcase. Freeze the 58 names from the prior
// per-spec evaluator; both source specs and BUILD.bazel have identical blobs
// in its base and this Accepted base. No arbitrary replacement test counts.
const expectedTotal = 59;
const trusted = raw && raw.assertionSource === 'wtr-onTestRunFinished' &&
  typeof nonce === 'string' && nonce.length === 32 && raw.runNonce === nonce &&
  raw.selected_assertion_inference !== true &&
  Array.isArray(raw.testResults) && raw.testResults.length === 1 &&
  String(raw.testResults[0].testFile).includes('src/material/sidenav/') &&
  Array.isArray(raw.testResults[0].assertionResults) &&
  Array.isArray(raw.testResults[0].sessionErrors) &&
  raw.testResults[0].sessionErrors.length === 0 &&
  raw.numTotalTests === expectedTotal &&
  raw.testResults[0].assertionResults.length === expectedTotal;
const assertions = trusted ? raw.testResults[0].assertionResults : [];
const normalize = name => String(name).replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ').trim();
const allNamesValid = assertions.every(item => typeof item.fullName === 'string' &&
  normalize(item.fullName) && ['passed', 'failed', 'pending'].includes(item.status));
const namesUnique = new Set(assertions.map(item => normalize(item.fullName))).size === assertions.length;
const f2pName = evaluator.FAIL_TO_PASS[0];
const f2pMatches = assertions.filter(item => {
  const actual = normalize(item.fullName);
  const expected = normalize(f2pName);
  return actual === expected || actual.endsWith(` ${expected}`);
});
const f2pAssertion = f2pMatches.length === 1 ? f2pMatches[0] : null;
const controls = f2pAssertion ? assertions.filter(item => item !== f2pAssertion) : [];
const expectedControls = controlsContract?.control_assertions;
const controlContractValid = controlsContract?.instance_id === 'angular__components-32661' &&
  controlsContract?.base_commit === evaluator.base_commit &&
  controlsContract?.official_test_patch_sha256 === evaluator.pr_diff_split.official_test_patch_sha256 &&
  controlsContract?.accepted_gold_total_assertions === expectedTotal &&
  Array.isArray(expectedControls) && expectedControls.length === expectedTotal - 1 &&
  new Set(expectedControls.map(normalize)).size === expectedTotal - 1;
const controlNameSetValid = controlContractValid &&
  controls.length === expectedControls.length &&
  expectedControls.every(name => controls.some(item => normalize(item.fullName) === normalize(name)));
const controlsValid = controls.length === expectedTotal - 1 &&
  controlNameSetValid && controls.every(item => item.status === 'passed');
const evidenceValid = Boolean(trusted && allNamesValid && namesUnique &&
  evaluator.FAIL_TO_PASS.length === 1 && evaluator.PASS_TO_PASS.length === 1 &&
  f2pAssertion && controlNameSetValid);
const f2pPassed = evidenceValid && f2pAssertion.status === 'passed' ? 1 : 0;
const p2pPassed = evidenceValid && controlsValid ? 1 : 0;
const commandOk = Number(statusText) === 0;
const resolved = commandOk && f2pPassed === 1 && p2pPassed === 1;
fs.writeFileSync(outputPath, `${JSON.stringify({
  phase: 'official-tests', exit_code: Number(statusText), resolved,
  assertion_source: trusted ? raw.assertionSource : 'missing_or_untrusted_per_spec_report',
  raw_test_count: trusted ? assertions.length : null,
  control_contract_sha256: controlsHash,
  control_name_set_valid: Boolean(controlNameSetValid),
  FAIL_TO_PASS: {passed: f2pPassed, failed: 1 - f2pPassed, total: 1},
  PASS_TO_PASS: {passed: p2pPassed, failed: 1 - p2pPassed, total: 1},
  selected_assertions: {
    FAIL_TO_PASS: [{expected: f2pName, actual: f2pAssertion?.fullName ?? null,
      status: f2pAssertion?.status ?? 'missing_or_ambiguous', match_count: f2pMatches.length}],
    PASS_TO_PASS: [{expected: evaluator.PASS_TO_PASS[0],
      group_definition: 'exact 58 frozen upstream Jasmine spec names in the accepted 59-spec material/sidenav suite',
      expected_assertions: 58, observed_assertions: controls.length,
      passed_assertions: controls.filter(item => item.status === 'passed').length,
      assertions: controls.map(item => ({actual: item.fullName, status: item.status}))}],
  },
  evidence_valid: evidenceValid,
}, null, 2)}\n`);
process.exit(resolved ? 0 : 1);
