// Serve the repository's installed accessibility rules locally. The real
// accessibility-checker and all test assertions remain enabled.
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');

const repo = '/workspace/repo';
const engine = path.join(repo, 'node_modules/accessibility-checker-engine');
const version = JSON.parse(fs.readFileSync(path.join(engine, 'package.json'))).version;
const config = path.join(repo, '.achecker.yml');
const configNames = ['.achecker.yml', '.achecker.yaml', 'achecker.js', 'achecker.json',
  '.config/.achecker.yml', '.config/.achecker.yaml', '.config/achecker.js', '.config/achecker.json'];
const originalPath = configNames.map(name => path.join(repo, name)).find(file => fs.existsSync(file));
const original = !originalPath ? {} : /\.ya?ml$/.test(originalPath)
  ? require(path.join(repo, 'node_modules/js-yaml')).load(fs.readFileSync(originalPath, 'utf8'))
  : require(originalPath);
const reports = fs.mkdtempSync(path.join(os.tmpdir(), 'swe-bench-a11y-'));
const assets = new Map([
  ['/rules/js/ace.js', path.join(engine, 'ace.js')],
  ['/rules/js/ace-node.js', path.join(engine, 'ace-node.js')],
]);
for (const file of assets.values()) fs.accessSync(file, fs.constants.R_OK);
let createdConfig;
let child;
const server = http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (request.url === '/archives.json') {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify([
      {id: version, name: 'Installed rules', path: '/rules', version},
      {id: 'latest', name: 'Installed rules', path: '/rules', version},
    ]));
  } else if (assets.has(request.url)) {
    response.setHeader('Content-Type', 'application/javascript');
    fs.createReadStream(assets.get(request.url)).pipe(response);
  } else {
    response.writeHead(404); response.end();
  }
});
function cleanup() {
  if (createdConfig && fs.existsSync(config) && fs.readFileSync(config, 'utf8') === createdConfig) {
    fs.unlinkSync(config);
  }
  server.close();
}
server.on('error', error => {console.error(error); cleanup(); process.exitCode = 1;});
server.listen(0, '127.0.0.1', () => {
  try {
    // Preserve Carbon's policies, failure levels and baseline configuration.
    // JSON is valid YAML. Never overwrite an existing developer-owned file.
    if (!fs.existsSync(config)) {
      createdConfig = JSON.stringify({...original,
        ruleServer: `http://127.0.0.1:${server.address().port}`,
        outputFolder: reports, cacheFolder: path.join(reports, 'cache')}, null, 2);
      fs.writeFileSync(config, createdConfig, {flag: 'wx'});
    }
    const [executable, ...args] = process.argv.slice(2);
    if (!executable) throw Error('Expected a test command');
    child = spawn(executable, args, {cwd: repo, stdio: 'inherit'});
    child.once('error', error => {console.error(error); cleanup(); process.exitCode = 1;});
    child.once('exit', (code, signal) => {cleanup(); process.exitCode = code ?? (signal ? 1 : 0);});
  } catch (error) {console.error(error); cleanup(); process.exitCode = 1;}
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {if (child) child.kill(signal); else cleanup();});
}
