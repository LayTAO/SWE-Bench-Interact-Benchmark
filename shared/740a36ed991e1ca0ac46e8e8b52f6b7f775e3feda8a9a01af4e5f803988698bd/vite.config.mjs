import { realpathSync } from 'node:fs';
import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';
const radixSource = {
  name: 'interactrepair-radix-source-alias',
  enforce: 'pre',
  resolveId(source) {
    if (!source.startsWith('@radix-ui/')) return null;
    const name = source.slice('@radix-ui/'.length);
    const group = name.startsWith('react-') ? 'react' : 'core';
    const directory = name.startsWith('react-') ? name.slice('react-'.length) : name;
    return `/subject/packages/${group}/${directory}/src/index.ts`;
  },
};
export default defineConfig({
  root: realpathSync('/oracle'),
  cacheDir: '/state-cache/vite',
  plugins: [radixSource, react({ jsxRuntime: 'classic', fastRefresh: false })],
  resolve: { alias: [
    { find: /^react$/, replacement: '/subject/node_modules/react/index.js' },
    { find: /^react-dom$/, replacement: '/subject/node_modules/react-dom/index.js' },
    { find: /^react-dom\/client$/, replacement: '/subject/node_modules/react-dom/client.js' },
  ]},
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, fs: { allow: ['/subject', '/oracle', '/tooling'] } },
});
