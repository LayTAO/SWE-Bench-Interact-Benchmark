import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';

const appRoot = process.env.REPRO_APP_ROOT || '/oracle';

export default defineConfig({
  root: appRoot,
  cacheDir: '/state-cache/vite',
  plugins: [react({ fastRefresh: false, include: /\.[jt]sx?$/ })],
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
  build: { outDir: 'dist', emptyOutDir: true },
  server: { fs: { allow: ['/subject', '/oracle', '/tooling'] } },
});
