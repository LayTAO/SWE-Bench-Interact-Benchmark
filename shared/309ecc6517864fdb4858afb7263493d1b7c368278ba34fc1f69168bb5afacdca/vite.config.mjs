import {defineConfig} from '/tooling/node_modules/vite/dist/node/index.js'
import vue from '/tooling/node_modules/@vitejs/plugin-vue/dist/index.mjs'
const appRoot = process.env.REPRO_APP_ROOT || '/oracle'
export default defineConfig({
  root: appRoot, cacheDir: '/state-cache/vite', plugins: [vue()],
  resolve: {alias: {'@': '/subject/packages/core/src', vue: '/subject/packages/core/node_modules/vue', 'reka-ui': '/subject/packages/core/src/index.ts', '@internationalized/date': '/subject/packages/core/node_modules/@internationalized/date'}},
  optimizeDeps: {noDiscovery: true, include: []},
  build: {outDir: '/state-cache/dist', emptyOutDir: true},
  server: {host: '0.0.0.0', port: 4173, strictPort: true, fs: {allow: ['/subject', appRoot, '/tooling']}},
})
