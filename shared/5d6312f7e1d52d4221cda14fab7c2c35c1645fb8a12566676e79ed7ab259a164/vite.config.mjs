import { realpathSync } from 'node:fs';
import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';
import legacyReactSource from '/tooling/legacy-react.mjs';

const muiErrorMacroShim = {
  name: 'interactrepair-mui-error-macro-shim',
  enforce: 'pre',
  resolveId(source) {
    if (source.endsWith('MuiError.macro') || source.endsWith('MuiError.macro.js')) {
      return '\0interactrepair-mui-error';
    }
    return null;
  },
  load(id) {
    return id === '\0interactrepair-mui-error'
      ? 'export default class MuiError extends Error {}'
      : null;
  },
};

export default defineConfig({
  root: realpathSync('/oracle'),
  cacheDir: '/state-cache/vite',
  plugins: [
    muiErrorMacroShim,
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
      {
        find: /^@mui\/utils\/macros\/MuiError\.macro$/,
        replacement: '/subject/packages/mui-utils/macros/MuiError.macro.js',
      },
      { find: '@mui/utils', replacement: '/subject/packages/mui-utils/src' },
      { find: '@mui/system', replacement: '/subject/packages/mui-system/src' },
      { find: '@mui/base', replacement: '/subject/packages/mui-base/src' },
      { find: '@mui/private-theming', replacement: '/subject/packages/mui-private-theming/src' },
      { find: '@mui/styled-engine', replacement: '/subject/packages/mui-styled-engine/src' },
      { find: '@mui/types', replacement: '/subject/packages/mui-types/src' },
      { find: '@mui/material', replacement: '/subject/packages/mui-material/src' },
    ],
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: { fs: { allow: ['/subject', '/oracle', '/tooling'] } },
});
