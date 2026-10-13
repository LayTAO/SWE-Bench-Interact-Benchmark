import { realpathSync } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';

function subjectWorkspaceSource() {
  return {
    name: 'interactrepair-polaris-workspace-source',
    enforce: 'pre',
    resolveId(source) {
      const parts = source.split('/');
      const isScopedRoot = source.startsWith('@') && parts.length === 2;
      const isUnscopedRoot = !source.startsWith('@') && parts.length === 1;
      if (!isScopedRoot && !isUnscopedRoot) return null;
      const packageDir = path.join('/subject/packages', source);
      const manifest = path.join(packageDir, 'package.json');
      if (!fs.existsSync(manifest)) return null;
      const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      const entry = data.source || data.module || data.main;
      return entry ? path.join(packageDir, entry) : null;
    },
  };
}

export default defineConfig({
  root: realpathSync('/oracle'),
  cacheDir: '/state-cache/vite',
  plugins: [
    subjectWorkspaceSource(),
    react({ jsxRuntime: 'classic', fastRefresh: false }),
  ],
  resolve: {
    alias: [
      { find: /^react$/, replacement: '/subject/node_modules/react/index.js' },
      { find: /^react-dom$/, replacement: '/subject/node_modules/react-dom/index.js' },
    ],
    preserveSymlinks: false,
  },
  css: { preprocessorOptions: { scss: { api: 'legacy' } } },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    fs: { allow: ['/subject', '/oracle', '/tooling'] },
  },
});
