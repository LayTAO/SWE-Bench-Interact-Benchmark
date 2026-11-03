// Validate Yarn's actual workspace locations, including nested installations.
// A published build tool may legitimately share a name with a local workspace.
import fs from 'node:fs';
import path from 'node:path';
import {workspace, fingerprint} from './candidate-workspace.mjs';

const subject = process.argv[2];
const output = process.argv[3];
const tree = workspace(subject);
const state = fs.readFileSync(path.join(tree.root, 'node_modules/.yarn-state.yml'), 'utf8');
const links = [];
let locator = null, target = null, locations = false;
function withinCandidate(relative) {
  const file = path.resolve(tree.root, relative);
  if (file !== tree.root && !file.startsWith(tree.root + path.sep)) {
    throw new Error(`Workspace location escapes candidate: ${relative}`);
  }
  return file;
}
for (const line of state.split('\n')) {
  const heading = line.match(/^(".*"):\s*$/);
  if (heading) {
    locator = JSON.parse(heading[1]);
    target = locator.match(/(?:@|#)workspace:(.+)$/)?.[1] ?? null;
    locations = false;
  } else if (line === '  locations:') {
    locations = true;
  } else if (/^  \S/.test(line)) {
    locations = false;
  } else if (target && locations) {
    const location = line.match(/^    - (".*")\s*$/);
    if (!location && line.trim()) throw new Error(`Unsupported Yarn workspace location: ${line}`);
    if (!location) continue;
    const relative = JSON.parse(location[1]);
    const installed = withinCandidate(relative), expected = withinCandidate(target);
    const actual = fs.realpathSync(installed);
    if (actual !== fs.realpathSync(expected)) {
      throw new Error(`Workspace dependency points outside candidate: ${locator} at ${relative} -> ${actual}`);
    }
    links.push({locator, location: relative, target, actual});
  }
}
if (!links.length) throw new Error('Frozen Yarn installation has no workspace locations');
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'parcel-workspace-links.json'), JSON.stringify(links, null, 2) + '\n');
console.log(fingerprint(subject, output));
