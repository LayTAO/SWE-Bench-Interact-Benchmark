const fs = require("fs");
const [rawPath, evaluatorPath, outputPath, statusText] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
let raw = {};
try { raw = JSON.parse(fs.readFileSync(rawPath, "utf8")); } catch (_) {}
// The accessibility control has the same title in DateField and TimeField.
// Both selected assertions belong to the TimeField official test file.
const selectedFile = "/packages/core/src/TimeField/TimeField.test.ts";
const statuses = (raw.testResults || [])
  .filter(suite => typeof suite.name === "string" && suite.name.endsWith(selectedFile))
  .flatMap(suite => (suite.assertionResults || []).map(item => ({
    name: item.fullName, status: item.status,
  })));
const normalizeAssertion = value => String(value).replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ').trim();
function count(names) {
  let passed = 0;
  for (const expected of names || []) {
    const matches = statuses.filter(item => normalizeAssertion(item.name) === normalizeAssertion(expected));
    if (matches.length === 1 && matches[0].status === "passed") passed++;
  }
  return {passed, failed: (names || []).length - passed, total: (names || []).length};
}
const f2p = count(evaluator.FAIL_TO_PASS);
const p2p = count(evaluator.PASS_TO_PASS);
const commandOk = Number(statusText) === 0;
const realEvidence = raw.assertionSource !== "accepted-exit-code-normalized";
const resolved = commandOk && realEvidence && f2p.failed === 0 && p2p.failed === 0 && f2p.total > 0 && p2p.total > 0;
const result = {
  phase: "official-tests",
  exit_code: Number(statusText),
  official_status: Number(statusText),
  resolved,
  assertion_source: raw.assertionSource || "structured-test-output",
  f2p_passed: realEvidence && f2p.total > 0 && f2p.failed === 0,
  p2p_passed: realEvidence && p2p.total > 0 && p2p.failed === 0,
  FAIL_TO_PASS: f2p,
  PASS_TO_PASS: p2p,
};
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
process.exit(resolved ? 0 : 1);
