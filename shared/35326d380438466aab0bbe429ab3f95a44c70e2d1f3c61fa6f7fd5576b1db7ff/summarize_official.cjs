const fs = require("fs");
const crypto = require("crypto");
const [rawPath, evaluatorPath, outputPath, statusText] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
const mappingBytes = fs.readFileSync('/tests/verifier/selected_assertion_map.json');
const mapping = JSON.parse(mappingBytes);
const mappingSha256 = crypto.createHash('sha256').update(mappingBytes).digest('hex');
for (const field of ['FAIL_TO_PASS', 'PASS_TO_PASS']) {
  const expected = evaluator[field];
  const selected = mapping[field];
  if (!Array.isArray(expected) || !selected || typeof selected !== 'object' ||
      Object.keys(selected).length !== expected.length ||
      expected.some(name => typeof selected[name] !== 'string')) {
    throw new Error(`${field}: frozen evaluator and selected assertion map differ`);
  }
}
const mappedNames = Object.values(mapping.FAIL_TO_PASS).concat(Object.values(mapping.PASS_TO_PASS));
if (new Set(mappedNames).size !== mappedNames.length) {
  throw new Error('selected native assertion names are not unique');
}
let raw = {};
try { raw = JSON.parse(fs.readFileSync(rawPath, "utf8")); } catch (_) {}
const provenance = raw.assertionSource || raw.source || "missing";
const assertions = raw.testResults?.[0]?.assertionResults;
const trusted = provenance === "karma-reporter-events" &&
  raw.selected_assertion_inference === false && raw.run_complete === true &&
  /^[0-9a-f]{32}$/.test(raw.runNonce || "") &&
  Array.isArray(raw.browsers) && raw.browsers.length === 1 &&
  Array.isArray(assertions) && raw.event_count === assertions.length &&
  raw.numTotalTests === assertions.length &&
  raw.numPassedTests + raw.numFailedTests + raw.numPendingTests === assertions.length &&
  raw.event_count > 0;
if (!trusted) raw = {};
const statuses = [];
function visit(value) {
  if (!value || typeof value !== "object") return;
  if (typeof value.status === "string" && (value.fullName || value.title || value.name)) {
    statuses.push({name: value.fullName || value.name || value.title, status: value.status});
  }
  for (const child of Object.values(value)) visit(child);
}
visit(raw);
function count(names, field) {
  let passed = 0;
  for (const expected of names || []) {
    const matches = statuses.filter(item => item.name === mapping[field][expected]);
    if (matches.length === 1 && matches[0].status === "passed") passed++;
  }
  return {passed, failed: (names || []).length - passed, total: (names || []).length};
}
const f2p = count(evaluator.FAIL_TO_PASS, 'FAIL_TO_PASS');
const p2p = count(evaluator.PASS_TO_PASS, 'PASS_TO_PASS');
const commandOk = Number(statusText) === 0;
const resolved = commandOk && f2p.failed === 0 && p2p.failed === 0 && f2p.total > 0 && p2p.total > 0;
const result = {
  phase: "official-tests",
  exit_code: Number(statusText),
  official_status: Number(statusText),
  resolved,
  assertion_source: trusted ? provenance : `rejected:${provenance}`,
  selected_assertion_map_sha256: mappingSha256,
  f2p_passed: f2p.total > 0 && f2p.failed === 0,
  p2p_passed: p2p.total > 0 && p2p.failed === 0,
  FAIL_TO_PASS: f2p,
  PASS_TO_PASS: p2p,
};
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
process.exit(resolved ? 0 : 1);
