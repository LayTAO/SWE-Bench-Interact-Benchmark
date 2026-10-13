const fs = require("fs");
const [rawPath, evaluatorPath, outputPath, statusText] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
let raw = {};
try { raw = JSON.parse(fs.readFileSync(rawPath, "utf8")); } catch (_) {}
// Require a distinct native WTR leaf for every selected assertion. This issue
// intentionally contains two different tests with the same title; consume
// their two recorded rows rather than projecting one pass onto both.
const statuses = Array.isArray(raw.testResults) ? raw.testResults : [];
function count(names) {
  let passed = 0;
  const consumed = new Set();
  for (const expected of names || []) {
    const index = statuses.findIndex((item, index) =>
      !consumed.has(index) && item.name === expected && item.status === "passed");
    if (index >= 0) { consumed.add(index); passed++; }
  }
  return {passed, failed: (names || []).length - passed, total: (names || []).length};
}
const f2p = count(evaluator.FAIL_TO_PASS);
const p2p = count(evaluator.PASS_TO_PASS);
const commandOk = Number(statusText) === 0;
const resolved = commandOk && f2p.failed === 0 && p2p.failed === 0 && f2p.total > 0 && p2p.total > 0;
const result = {phase: "official-tests", exit_code: Number(statusText), resolved, FAIL_TO_PASS: f2p, PASS_TO_PASS: p2p};
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
process.exit(resolved ? 0 : 1);
