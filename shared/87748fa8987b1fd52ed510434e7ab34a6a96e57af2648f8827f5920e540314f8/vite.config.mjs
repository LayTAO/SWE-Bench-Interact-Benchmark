import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js'
import vue from '/tooling/node_modules/@vitejs/plugin-vue/dist/index.mjs'
import vueJsx from '/tooling/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs'

const appRoot = process.env.REPRO_APP_ROOT || '/oracle'

export default defineConfig({
  root: appRoot,
  cacheDir: '/state-cache/vite',
  plugins: [vue(), vueJsx()],
  define: {
    __VUETIFY_VERSION__: JSON.stringify('benchmark'),
    __REQUIRED_VUE__: JSON.stringify('^3.0.0'),
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  resolve: {
    alias: {
      vue: '/subject/node_modules/vue',
      '@': '/subject/packages/vuetify/src',
      vuetify: '/subject/packages/vuetify/src',
    },
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    fs: { allow: ['/subject', appRoot, '/tooling'] },
  },
})
