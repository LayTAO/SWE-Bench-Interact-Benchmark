import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';

const paths = JSON.parse(fs.readFileSync('/subject/tsconfig.base.json', 'utf8')).compilerOptions.paths;

function fluentSourcePaths() {
  return {
    name: 'interactrepair-fluent-source-paths',
    enforce: 'pre',
    resolveId(source) {
      if (!source.startsWith('@fluentui/')) return null;
      for (const [pattern, replacements] of Object.entries(paths)) {
        if (!pattern.includes('*') && pattern === source) {
          return path.join('/subject', replacements[0]);
        }
        if (pattern.includes('*')) {
          const [prefix, suffix] = pattern.split('*');
          if (source.startsWith(prefix) && source.endsWith(suffix)) {
            const match = source.slice(prefix.length, source.length - suffix.length);
            return path.join('/subject', replacements[0].replace('*', match));
          }
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  root: process.env.IR_RUNTIME_ORACLE || '/oracle',
  cacheDir: `${process.env.IR_STATE_CACHE || '/state-cache'}/vite`,
  plugins: [
    fluentSourcePaths(),
    react({ jsxRuntime: 'classic', fastRefresh: false }),
  ],
  resolve: {
    alias: [
      {
        find: /^react\/jsx-runtime$/,
        replacement: '/subject/node_modules/react/jsx-runtime.js',
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: '/subject/node_modules/react/jsx-dev-runtime.js',
      },
      { find: /^react$/, replacement: '/subject/node_modules/react/index.js' },
      { find: /^react-dom$/, replacement: '/subject/node_modules/react-dom/index.js' },
    ],
    preserveSymlinks: false,
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: `${process.env.IR_STATE_CACHE || '/state-cache'}/dist`, emptyOutDir: true },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    fs: { allow: ['/subject', process.env.IR_RUNTIME_ORACLE || '/oracle', '/tooling'] },
  },
});
