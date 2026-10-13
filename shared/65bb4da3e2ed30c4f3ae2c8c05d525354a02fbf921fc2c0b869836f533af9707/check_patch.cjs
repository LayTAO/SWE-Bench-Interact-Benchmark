const fs = require('fs');

const path = process.argv[2];
if (!path) throw new Error('patch path is required');
const text = fs.readFileSync(path, 'utf8');
if (!text.trim()) throw new Error('empty patch');

const touched = [];
for (const line of text.split(/\r?\n/)) {
  if (line.startsWith('diff --git ')) {
    const match = /^diff --git a\/([^ ]+) b\/([^ ]+)$/.exec(line);
    if (!match) throw new Error(`unsupported or ambiguous diff header: ${line}`);
    touched.push(match[1], match[2]);
  }
  if (line.startsWith('--- ') || line.startsWith('+++ ')) {
    const value = line.slice(4).split('\t', 1)[0];
    if (value !== '/dev/null') {
      if (value.startsWith('a/') || value.startsWith('b/')) touched.push(value.slice(2));
      else throw new Error(`unsupported patch path: ${value}`);
    }
  }
}

if (touched.length === 0) throw new Error('patch contains no file changes');
for (const file of touched) {
  if (!file || file.startsWith('/') || file === '.' || file === '..' ||
      file.startsWith('../') || file.includes('/../') || file.includes('\\') ||
      file.includes('\0')) {
    throw new Error(`unsafe patch path: ${file}`);
  }
  if (file === '.git' || file.startsWith('.git/') || file === 'tests' ||
      file.startsWith('tests/') || file === 'solution' || file.startsWith('solution/') ||
      file === 'verifier' || file.startsWith('verifier/')) {
    throw new Error(`patch touches verifier-controlled path: ${file}`);
  }
}
