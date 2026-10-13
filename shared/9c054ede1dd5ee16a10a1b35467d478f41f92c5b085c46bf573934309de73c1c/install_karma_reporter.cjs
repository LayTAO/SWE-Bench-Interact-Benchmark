const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) throw new Error('subject root is required');
const candidates = [
  'node_modules/@bazel/concatjs/web_test/karma.conf.js',
  'node_modules/@angular/dev-infra-private/node_modules/@bazel/concatjs/web_test/karma.conf.js',
  // Bazel's npm repository is a frozen copy, not a symlink to node_modules.
  // The test action loads this copy, so patching only the package-manager
  // paths leaves the per-spec reporter absent despite a green Karma run.
  'node_modules/.cache/bazel-output/external/npm/@bazel/concatjs/web_test/karma.conf.js',
  'node_modules/.cache/bazel-output/execroot/angular_material/external/npm/@bazel/concatjs/web_test/karma.conf.js',
];
const anchor = "mergeConfigArray(conf, 'reporters', ['progress']);";
const injection = `${anchor}\n    mergeConfigArray(conf, 'plugins', [require('/tests/verifier/karma-assertion-reporter.cjs')]);\n    mergeConfigArray(conf, 'reporters', ['interact_assertions']);`;
let changed = 0;
for (const relative of candidates) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(injection)) { changed++; continue; }
  if (!source.includes(anchor)) throw new Error(`Karma reporter anchor is missing: ${file}`);
  fs.writeFileSync(file, source.replace(anchor, injection));
  changed++;
}
if (!changed) throw new Error('No @bazel/concatjs Karma configuration found');
