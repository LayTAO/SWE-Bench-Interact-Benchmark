import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';
import {defineConfig} from '/tooling/node_modules/vite/dist/node/index.js';
import path from 'node:path';

export default defineConfig({
  plugins: [
    {
      name: 'react-spectrum-parcel-intl-glob',
      enforce: 'pre',
      transform(code, id) {
        if (!id.startsWith('/subject/packages/') && !id.startsWith('/workspace/subject/packages/')) return;
        const globImport = /import\s+(\w+)\s+from\s+(['"])([^'"]+\/\*\.json)\2\s*;?/g;
        let changed = false;
        const transformed = code.replace(globImport, (_match, name, _quote, pattern) => {
          changed = true;
          const normalizedId = id.replace(/^\/workspace\/subject\//, '/subject/');
          const absolutePattern = path.posix.normalize(path.posix.join(path.posix.dirname(normalizedId), pattern));
          return `const ${name} = Object.fromEntries(Object.entries(import.meta.glob('${absolutePattern}', {eager: true, import: 'default'})).map(([key, value]) => [key.slice(key.lastIndexOf('/') + 1, -5), value]));`;
        });
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
      {find: /^react-aria-components\/(.*)$/, replacement: '/subject/packages/react-aria-components/exports/$1.ts'},
      {find: /^react-aria\/(.*)$/, replacement: '/subject/packages/react-aria/exports/$1'},
      {find: 'react-aria', replacement: '/subject/packages/react-aria/exports/index.ts'},
      {find: /^react-stately\/(.*)$/, replacement: '/subject/packages/react-stately/exports/$1'},
      {find: 'react-stately', replacement: '/subject/packages/react-stately/exports/index.ts'},
      {find: /^@internationalized\/(.*)$/, replacement: '/subject/packages/@internationalized/$1/index.ts'},
    ],
  },
  server: {host: '0.0.0.0', port: 4173, strictPort: true, fs: {allow: ['/subject', '/oracle-src', '/tooling']}},
  build: {outDir: '/state-cache/dist', emptyOutDir: true},
});
