import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js'
import vue from '/tooling/node_modules/@vitejs/plugin-vue/dist/index.mjs'

const subject = process.env.SUBJECT_DIR || '/subject'
const appRoot = process.env.REPRO_APP_ROOT || '/oracle'

export default defineConfig({
  root: appRoot,
  plugins: [vue()],
  resolve: { alias: [
    { find: '@/', replacement: `${subject}/packages/core/src/` },
    { find: '@', replacement: `${subject}/packages/core/src` },
    { find: 'reka-ui', replacement: `${subject}/packages/core/src/index.ts` },
    { find: '@internationalized/date', replacement: `${subject}/packages/core/node_modules/@internationalized/date` },
    { find: 'vue', replacement: `${subject}/packages/core/node_modules/vue` },
  ] },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, fs: { allow: ['/subject', appRoot, '/tooling'] } },
})
