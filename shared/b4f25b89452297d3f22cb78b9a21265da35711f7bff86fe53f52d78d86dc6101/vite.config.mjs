import { realpathSync } from 'node:fs';
import { defineConfig } from '/subject/packages/core/node_modules/vite/dist/node/index.js';
import vue from '/subject/packages/core/node_modules/@vitejs/plugin-vue/dist/index.mjs';

export default defineConfig({
  root: realpathSync('/oracle'),
  cacheDir: '/state-cache/vite',
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^vue$/, replacement: '/subject/packages/core/node_modules/vue' },
      { find: /^@\//, replacement: '/subject/packages/core/src/' },
    ],
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: { fs: { allow: ['/subject', '/oracle', '/tooling'] } },
});
