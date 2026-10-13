import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js'

const appRoot = process.env.REPRO_APP_ROOT || '/oracle'

export default defineConfig({
  root: appRoot,
  cacheDir: '/state-cache/vite',
  plugins: [],
  define: {
    __VUETIFY_VERSION__: JSON.stringify('benchmark'),
    __REQUIRED_VUE__: JSON.stringify('^2.6.0'),
  },
  resolve: {
    alias: {
      vue: '/subject/node_modules/vue/dist/vue.esm.js',
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
