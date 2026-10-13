const fs = require("fs");
const [rawPath, evaluatorPath, outputPath, statusText] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
let raw = {};
try { raw = JSON.parse(fs.readFileSync(rawPath, "utf8")); } catch (_) {}
const executedTestFiles = Array.isArray(raw.testFiles) ? raw.testFiles : [];
const allTestsPassed = raw.allTestsPassed === true;
const statuses = [];
function visit(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.status === "string" && (value.fullName || value.title || value.name)) {
    statuses.push({name: value.fullName || value.name || value.title, status: value.status});
  }
  for (const child of Object.values(value)) visit(child);
}
visit(raw);
const normalizeAssertion = value => String(value).replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ').trim().replace(/^focusScope /, '');
function count(names) {
  let passed = 0;
  for (const expected of names || []) {
    const matches = statuses.filter(item => normalizeAssertion(item.name) === normalizeAssertion(expected));
    const sourcePath = expected.match(/\bsrc\/[^ ]+\.js$/);
    const pathWasExecuted = sourcePath && executedTestFiles.some(file => file.endsWith(sourcePath[0]));
    const projectedAssertion = /^projected browser assertion \d+$/.test(expected);
    if (
      (matches.length === 1 && matches[0].status === "passed") ||
      (allTestsPassed && (projectedAssertion || pathWasExecuted))
    ) passed++;
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
