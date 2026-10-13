import fs from 'node:fs';
import path from 'node:path';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';
import {defineConfig} from '/tooling/node_modules/vite/dist/node/index.js';

export default defineConfig({
  plugins: [
    {
      name: 'react-spectrum-parcel-intl-glob',
      enforce: 'pre',
      transform(code, id) {
        const cssRewritten = code.replace(/import\s+(\w+)\s+from\s+(['"])([^'"]+\.css)(?:\?[^'"]*)?\2\s*;?/g, (_match, name, quote, path) => `import ${quote}${path}${quote}; const ${name} = {};`);
        let changed = cssRewritten !== code;
        code = cssRewritten;
        const globImport = /import\s+(\w+)\s+from\s+(['"])([^'"]+\/\*\.json)\2\s*;?/g;
        let transformed = code;
        if (id.startsWith('/subject/packages/') || id.startsWith('/workspace/subject/packages/')) {
          const normalizedId = id.replace(/^\/workspace\/subject\//, '/subject/');
          transformed = code.replace(globImport, (_match, name, _quote, pattern) => {
            changed = true;
            const absoluteDir = path.posix.normalize(path.posix.join(path.posix.dirname(normalizedId), pattern.replace(/\/\*\.json$/, '')));
            const files = fs.readdirSync(absoluteDir).filter(file => file.endsWith('.json')).sort();
            const imports = files.map((file, index) => `import __intl_${index} from '${absoluteDir}/${file}';`).join('\n');
            const entries = files.map((file, index) => `${JSON.stringify(file.slice(0, -5))}: __intl_${index}`).join(', ');
            return `${imports}\nconst ${name} = {${entries}};`;
          });
        }
        if (changed) return {code: transformed, map: null};
      },
    },
    react(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {find: 'react', replacement: '/subject/node_modules/react'},
      {find: 'react-dom', replacement: '/subject/node_modules/react-dom'},
      {find: 'react-aria-components', replacement: '/subject/packages/react-aria-components/index.ts'},
      {find: /^@react-spectrum\/(.*)$/, replacement: '/subject/packages/@react-spectrum/$1/index.ts'},
      {find: /^@react-aria\/(.*)$/, replacement: '/subject/packages/@react-aria/$1/index.ts'},
      {find: /^@react-stately\/(.*)$/, replacement: '/subject/packages/@react-stately/$1/index.ts'},
      {find: /^react-aria-components\/(.*)$/, replacement: '/subject/packages/react-aria-components/exports/$1.ts'},
      {find: /^react-aria\/(.*)$/, replacement: '/subject/packages/react-aria/exports/$1'},
      {find: 'react-aria', replacement: '/subject/packages/react-aria/index.ts'},
      {find: /^react-stately\/(.*)$/, replacement: '/subject/packages/react-stately/exports/$1'},
      {find: 'react-stately', replacement: '/subject/packages/react-stately/index.ts'},
      {find: /^@internationalized\/(.*)$/, replacement: '/subject/packages/@internationalized/$1/index.ts'},
    ],
  },
  server: {host: '0.0.0.0', port: 4173, strictPort: true, fs: {allow: ['/work/app', '/subject', '/oracle-src', '/tooling']}},
  build: {outDir: '/state-cache/dist', emptyOutDir: true},
});
