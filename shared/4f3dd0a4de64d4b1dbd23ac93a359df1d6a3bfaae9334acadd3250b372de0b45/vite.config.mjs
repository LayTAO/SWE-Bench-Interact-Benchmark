import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';
import legacyReactSource from '/tooling/legacy-react.mjs';

// The verifier's in-process engine mounts the canonical directories through
// symlinks.  Vite resolves module ids to their physical paths, so using the
// logical /oracle root makes its HTML plugin emit an invalid ../logs/... name.
// Resolve the mounts once so root, cache, and output all share one namespace.
const oracleRoot = fs.realpathSync('/oracle');
const stateCacheRoot = fs.realpathSync('/state-cache');

export default defineConfig({
  root: oracleRoot,
  cacheDir: path.join(stateCacheRoot, 'vite'),
  plugins: [
    legacyReactSource('automatic'),
    react({ jsxRuntime: 'automatic', fastRefresh: false }),
  ],
  resolve: {
    alias: [
      { find: /^react$/, replacement: '/subject/node_modules/react/index.js' },
      { find: /^react\/jsx-runtime$/, replacement: '/subject/node_modules/react/jsx-runtime.js' },
      { find: /^react\/jsx-dev-runtime$/, replacement: '/subject/node_modules/react/jsx-dev-runtime.js' },
      { find: /^react-dom$/, replacement: '/subject/node_modules/react-dom/index.js' },
      { find: /^react-dom\/client$/, replacement: '/subject/node_modules/react-dom/client.js' },
    ],
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: path.join(stateCacheRoot, 'dist'), emptyOutDir: true },
  server: { fs: { allow: ['/subject', '/oracle', '/tooling'] } },
});
