const fs = require("fs");
const path = require("path");
const [rawPath, evaluatorPath, outputPath, statusText] = process.argv.slice(2);
const evaluator = JSON.parse(fs.readFileSync(evaluatorPath, "utf8"));
const selectedMap = JSON.parse(fs.readFileSync(path.join(__dirname, "selected_assertion_map.json"), "utf8"));
let raw = {};
try { raw = JSON.parse(fs.readFileSync(rawPath, "utf8")); } catch (_) {}
const provenance = raw.assertionSource || raw.source || "missing";
const validSource = provenance === "cypress-junit-per-spec" && raw.selected_assertion_inference !== true;
const suites = validSource && Array.isArray(raw.testResults) ? raw.testResults : [];
const expectedSpecs = ["ContextMenu", "DropdownMenu", "Popover", "Select"];
const actualSpecs = suites.map(suite => suite.testFile);
const completeReports = expectedSpecs.every(spec =>
  actualSpecs.filter(file => file === `cypress/e2e/${spec}.cy.ts`).length === 1);
const selectedEvidence = {};
function count(names) {
  let passed = 0;
  for (const expected of names || []) {
    const selected = selectedMap[expected];
    const suite = selected && suites.find(item => item.testFile === `cypress/e2e/${selected.spec}.cy.ts`);
    const matches = suite && Array.isArray(suite.assertionResults)
      ? suite.assertionResults.filter(item => typeof item.fullName === "string" &&
          (item.fullName === selected.fullTitle || item.fullName.endsWith(` ${selected.fullTitle}`)))
      : [];
    const status = matches.length === 1 ? matches[0].status : "missing_or_ambiguous";
    selectedEvidence[expected] = {
      test_file: selected ? `cypress/e2e/${selected.spec}.cy.ts` : null,
      test_name: selected?.fullTitle || null,
      match_count: matches.length,
      status,
    };
    if (completeReports && status === "passed") passed++;
  }
  return {passed, failed: (names || []).length - passed, total: (names || []).length};
}
const f2p = count(evaluator.FAIL_TO_PASS);
const p2p = count(evaluator.PASS_TO_PASS);
const commandOk = Number(statusText) === 0;
const resolved = commandOk && f2p.failed === 0 && p2p.failed === 0 && f2p.total > 0 && p2p.total > 0;
const result = {
  phase: "official-tests",
  exit_code: Number(statusText),
  official_status: Number(statusText),
  resolved,
  assertion_source: validSource ? provenance : `rejected:${provenance}`,
  complete_reports: completeReports,
  selected_assertions: selectedEvidence,
  f2p_passed: f2p.total > 0 && f2p.failed === 0,
  p2p_passed: p2p.total > 0 && p2p.failed === 0,
  FAIL_TO_PASS: f2p,
  PASS_TO_PASS: p2p,
};
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
process.exit(resolved ? 0 : 1);
