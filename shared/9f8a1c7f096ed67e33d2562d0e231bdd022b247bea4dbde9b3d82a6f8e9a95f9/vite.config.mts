import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import VueMacros from 'unplugin-vue-macros/vite'

export default defineConfig({
  root: process.env.IR_RUNTIME_ORACLE || fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    VueMacros({
      setupComponent: false,
      setupSFC: false,
      plugins: {
        vue: Vue(),
        vueJsx: VueJsx(),
      },
    }),
  ],
  build: { outDir: `${process.env.IR_STATE_CACHE || '/state-cache'}/dist`, emptyOutDir: true },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, fs: { allow: ['/subject', process.env.IR_RUNTIME_ORACLE || '/oracle', '/tooling'] } },
})
