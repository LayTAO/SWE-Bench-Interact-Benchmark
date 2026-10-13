const fs = require("fs");
const [rawPath, evaluatorPath, outputPath, statusText] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
let raw = {};
try { raw = JSON.parse(fs.readFileSync(rawPath, "utf8")); } catch (_) {}
const statuses = [];
function visit(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.status === "string" && (value.fullName || value.title || value.name)) {
    statuses.push({name: value.fullName || value.name || value.title, status: value.status});
  }
  for (const child of Object.values(value)) visit(child);
}
visit(raw);
function count(names) {
  let passed = 0;
  for (const expected of names || []) {
    const matches = statuses.filter(item => item.name === expected || item.name.endsWith(expected));
    if (matches.some(item => item.status === "passed" || item.status === "expected")) passed++;
    else if (raw.success === true && raw.testResults?.some(file =>
      file.status === "passed" && Array.isArray(file.assertionResults) &&
      file.assertionResults.some(assertion =>
        assertion.status === "passed" &&
        (assertion.fullName === expected || assertion.fullName?.endsWith(expected) || assertion.title === expected)
      )
    )) passed++;
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
