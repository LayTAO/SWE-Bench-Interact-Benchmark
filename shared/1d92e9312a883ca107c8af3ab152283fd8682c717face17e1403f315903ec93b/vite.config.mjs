import { realpathSync } from 'node:fs';
import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';
import legacyReactSource from '/tooling/legacy-react.mjs';

export default defineConfig({
  root: realpathSync('/oracle'),
  cacheDir: '/state-cache/vite',
  plugins: [
    legacyReactSource('automatic'),
    react({ jsxRuntime: 'automatic', fastRefresh: false }),
  ],
  resolve: {
    alias: {
      react: '/subject/node_modules/react',
      'react-dom': '/subject/node_modules/react-dom',
      '@mui/utils': '/subject/packages/mui-utils/src',
      '@mui/system': '/subject/packages/mui-system/src',
      '@mui/base': '/subject/packages/mui-base/src',
      '@mui/private-theming': '/subject/packages/mui-private-theming/src',
      '@mui/styled-engine': '/subject/packages/mui-styled-engine/src',
      '@mui/types': '/subject/packages/mui-types/src',
      '@mui/material': '/subject/packages/mui-material/src',
    },
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    fs: { allow: ['/subject', '/oracle', '/tooling'] },
  },
});
