const fs = require('fs');
const path = require('path');

const outputBase = process.argv[2];
if (!outputBase) throw new Error('Bazel output base is required');
const external = path.join(outputBase, 'external');
const candidates = fs.readdirSync(external)
  .filter(name => name.startsWith('rules_browsers'))
  .map(name => path.join(external, name, 'wtr/wtr.config.mjs'))
  .filter(file => fs.existsSync(file));
if (candidates.length !== 1) {
  throw new Error(`Expected one rules_browsers WTR config; found ${candidates.length}`);
}
const file = candidates[0];
const original = fs.readFileSync(file, 'utf8');
const marker = '// INTERACT_ASSERTION_REPORTER_INSTALLED';
if (!original.includes(marker)) {
  const anchor = 'export default {';
  if (original.split(anchor).length !== 2) throw new Error(`Unknown WTR config shape: ${file}`);
  const patched = original.replace(anchor, 'const baseConfig = {') + `
${marker}
const {interactAssertionReporter} = await import('file:///tests/verifier/wtr-assertion-reporter.mjs');
export default {...baseConfig, reporters: [...(baseConfig.reporters ?? []), interactAssertionReporter]};
`;
  fs.writeFileSync(file, patched);
}
