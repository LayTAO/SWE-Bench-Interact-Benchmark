import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js'
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js'
import legacyReactSource from '/tooling/legacy-react.mjs'
const runtimeOracle = process.env.IR_RUNTIME_ORACLE || '/oracle'
const stateCache = process.env.IR_STATE_CACHE || '/state-cache'
export default defineConfig({
  root: runtimeOracle, cacheDir: `${stateCache}/vite`,
  plugins: [legacyReactSource('classic'), react({ jsxRuntime: 'classic', fastRefresh: false })],
  resolve: { alias: {
    react: '/subject/node_modules/react', 'react-dom': '/subject/node_modules/react-dom',
    '@': '/subject/src',
    '@mui/utils': '/subject/packages/mui-utils/src', '@mui/system': '/subject/packages/mui-system/src',
    '@mui/base': '/subject/packages/mui-base/src', '@mui/private-theming': '/subject/packages/mui-private-theming/src',
    '@mui/styled-engine': '/subject/packages/mui-styled-engine/src', '@mui/types': '/subject/packages/mui-types/src',
    '@mui/material': '/subject/packages/mui-material/src',
  }},
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: `${stateCache}/dist`, emptyOutDir: true },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, fs: { allow: ['/subject', runtimeOracle, '/tooling'] } },
})
