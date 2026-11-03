// Verifier-owned resolver: every workspace import uses the prepared candidate.
// Published dependencies remain available only for packages outside this tree.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const ignored = new Set(['node_modules', '.git', 'dist', 'build', '.parcel-cache', '.vite']);
const inside = (root, file) => file === root || file.startsWith(root + path.sep);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function workspace(subject) {
  if (!subject) throw new Error('SUBJECT_DIR must identify the complete prepared candidate');
  const root = fs.realpathSync(subject);
  const packages = new Map();
  function visit(dir) {
    const manifestPath = path.join(dir, 'package.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.name) {
        if (packages.has(manifest.name)) throw new Error(`Duplicate workspace package: ${manifest.name}`);
        packages.set(manifest.name, {dir, manifest});
        return;
      }
    }
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      if (ignored.has(entry.name) || entry.name.startsWith('.')) continue;
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) visit(file);
    }
  }
  visit(path.join(root, 'packages'));
  if (!packages.size) throw new Error(`No workspace packages in ${root}`);
  function checked(file) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    const real = fs.realpathSync(file);
    if (!inside(root, real)) throw new Error(`Candidate source escapes prepared tree: ${file}`);
    return real;
  }
  function sourceFile(file) {
    for (const suffix of ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js']) {
      const found = checked(file + suffix);
      if (found) return found;
    }
    return null;
  }
  function resolve(name, subpath = '') {
    const pkg = packages.get(name);
    if (!pkg) return null;
    let candidates;
    if (subpath) {
      const relative = subpath.replace(/^\//, '');
      if (relative.split('/').includes('..')) throw new Error(`Invalid workspace import: ${name}/${relative}`);
      candidates = [path.join(pkg.dir, 'src', relative), path.join(pkg.dir, relative)];
    } else {
      const declared = pkg.manifest.source || pkg.manifest.exports?.['.']?.source;
      candidates = [typeof declared === 'string' ? path.join(pkg.dir, declared) : null,
        path.join(pkg.dir, 'src/index'), path.join(pkg.dir, 'index')].filter(Boolean);
    }
    for (const file of candidates) {
      const found = sourceFile(file);
      if (found) return found;
    }
    throw new Error(`No candidate source entry for ${name}${subpath}; refusing published fallback`);
  }
  return {root, packages, resolve};
}

export function fingerprint(subject, output, checkLinks = false) {
  const tree = workspace(subject);
  const files = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      if (ignored.has(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        if (!inside(tree.root, fs.realpathSync(file))) throw new Error(`Source link escapes candidate: ${file}`);
        files.push([path.relative(tree.root, file), 'symlink:' + fs.readlinkSync(file)]);
      } else if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) files.push([path.relative(tree.root, file), sha(fs.readFileSync(file))]);
    }
  }
  visit(path.join(tree.root, 'packages'));
  // Parcel resolves workspace symlinks natively. Reject a dependency tree still
  // pointing at the base checkout, rather than running a partial candidate.
  if (checkLinks) for (const [name, pkg] of tree.packages) {
    const installed = path.join(tree.root, 'node_modules', name);
    if (!fs.existsSync(installed)) throw new Error(`Workspace dependency is not linked: ${name}`);
    if (fs.realpathSync(installed) !== fs.realpathSync(pkg.dir)) {
      throw new Error(`Workspace dependency points outside candidate: ${name} -> ${fs.realpathSync(installed)}`);
    }
  }
  const digest = sha(JSON.stringify(files));
  fs.mkdirSync(output, {recursive: true});
  fs.writeFileSync(path.join(output, 'candidate-workspace.json'), JSON.stringify({
    schema_version: 1, subject_root: tree.root, packages: [...tree.packages.keys()].sort(),
    source_sha256: digest, files,
  }, null, 2) + '\n');
  return digest;
}

export function candidateWorkspace(subject = process.env.SUBJECT_DIR_OVERRIDE || process.env.SUBJECT_DIR) {
  const tree = workspace(subject);
  const evidence = process.env.REPRO_EVIDENCE_DIR || process.env.OUTPUT_DIR;
  const seen = new Set();
  return {
    name: 'complete-candidate-workspace',
    enforce: 'pre',
    config() {
      return {
        resolve: {
          dedupe: ['react', 'react-dom'],
          alias: [...tree.packages].map(([name, pkg]) => ({
            find: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=/|$)'),
            replacement: pkg.dir,
            customResolver(id) { return tree.resolve(name, id.slice(pkg.dir.length)); },
          })),
        },
        optimizeDeps: {exclude: [...tree.packages.keys()]},
        server: {fs: {allow: [process.cwd(), tree.root]}},
      };
    },
    transform(code, id) {
      const file = id.split('?')[0];
      if (!inside(path.join(tree.root, 'packages'), file)) return null;
      const real = fs.realpathSync(file);
      if (!inside(tree.root, real)) throw new Error(`Candidate module escapes prepared tree: ${file}`);
      // These are bundler inputs, not a claim that every module was executed.
      if (evidence && !seen.has(real)) {
        fs.mkdirSync(evidence, {recursive: true});
        fs.appendFileSync(path.join(evidence, 'candidate-modules.jsonl'), JSON.stringify({
          path: path.relative(tree.root, real), sha256: sha(fs.readFileSync(real)),
        }) + '\n');
        seen.add(real);
      }
      // Spectrum's Parcel locale glob must also work in the frozen Vite app.
      const transformed = code.replace(/import\s+(\w+)\s+from\s+(['"])([^'"]+\/\*\.json)\2\s*;?/g,
        (_match, name, _quote, pattern) => {
          const dir = fs.realpathSync(path.resolve(path.dirname(real), path.dirname(pattern)));
          if (!inside(tree.root, dir)) throw new Error(`Locale directory escapes candidate: ${dir}`);
          const messages = Object.fromEntries(fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
            .map(f => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))]));
          return `const ${name} = ${JSON.stringify(messages)};`;
        });
      return transformed === code ? null : {code: transformed, map: null};
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(fingerprint(process.argv[2], process.argv[3], process.argv.includes('--check-links')));
}
