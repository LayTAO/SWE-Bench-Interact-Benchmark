#!/usr/bin/env bash
set -euo pipefail

SUBJECT_DIR="${1:?prepared candidate directory}"
OUTPUT_DIR="${2:?build evidence directory}"
SUBJECT_DIR="$(cd "$SUBJECT_DIR" && pwd -P)"
mkdir -p "$OUTPUT_DIR"

# Reject links into the frozen base before removing or rebuilding any output.
node - "$SUBJECT_DIR" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = fs.realpathSync(process.argv[2]);
for (const [directory, name] of [
  ['nimble-tokens', '@ni/nimble-tokens'],
  ['jasmine-parameterized', '@ni/jasmine-parameterized'],
  ['nimble-components', '@ni/nimble-components'],
]) {
  const pkg = path.join(root, 'packages', directory);
  if (fs.realpathSync(pkg) !== pkg) throw new Error(`Candidate package is redirected: ${pkg}`);
  const installed = path.join(root, 'node_modules', name);
  if (fs.realpathSync(installed) !== pkg) throw new Error(`Workspace dependency does not use the candidate: ${name}`);
  const dist = path.join(pkg, 'dist');
  if (fs.existsSync(dist) && fs.realpathSync(dist) !== dist) throw new Error(`Build output is redirected: ${dist}`);
}
// A nested installed copy must not shadow the workspace dependency.
for (const directory of ['nimble-tokens', 'jasmine-parameterized', 'nimble-components']) {
  for (const dependency of ['nimble-tokens', 'jasmine-parameterized']) {
    const nested = path.join(root, 'packages', directory, 'node_modules', '@ni', dependency);
    if (fs.existsSync(nested) && fs.realpathSync(nested) !== path.join(root, 'packages', dependency)) {
      throw new Error(`Nested dependency does not use the candidate: ${nested}`);
    }
  }
}
NODE

cd "$SUBJECT_DIR"
# Tokens stores source SVGs and fonts inside dist. Preserve those candidate
# inputs and remove only the outputs of its upstream build steps.
node - "$SUBJECT_DIR" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const outputs = [
  'nimble-tokens/dist/icons/ts', 'nimble-tokens/dist/icons/js',
  'nimble-tokens/dist/icons/ico', 'nimble-tokens/dist/fonts/scss',
  'nimble-tokens/dist/styledictionary',
  'jasmine-parameterized/dist', 'nimble-components/dist',
].map(relative => path.join(root, 'packages', relative));
// Validate every parent before deleting any output: a nested link must not
// redirect cleanup into the frozen base or another package.
for (const output of outputs) {
  for (let cursor = output; cursor !== root; cursor = path.dirname(cursor)) {
    if (fs.existsSync(cursor) && fs.realpathSync(cursor) !== cursor) {
      throw new Error(`Build output is redirected: ${cursor}`);
    }
  }
}
for (const output of outputs) fs.rmSync(output, {recursive: true, force: true});
NODE
npm run build --workspace @ni/nimble-tokens >"$OUTPUT_DIR/tokens-build.log" 2>&1
npm run build --workspace @ni/jasmine-parameterized -- --force >"$OUTPUT_DIR/jasmine-parameterized-build.log" 2>&1
npm run build --workspace @ni/nimble-components >"$OUTPUT_DIR/subject-build.log" 2>&1
