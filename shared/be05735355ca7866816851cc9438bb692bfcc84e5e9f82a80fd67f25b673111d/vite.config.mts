const { default: vue } = await import(`${process.env.IR_VUE_PLUGIN_DIR}/dist/index.mjs`)
const { default: vueJsx } = await import(`${process.env.IR_VUE_JSX_PLUGIN_DIR}/dist/index.mjs`)

export default {
  root: process.env.IR_RUNTIME_ORACLE || '.',
  resolve: { alias: { '/subject': process.env.IR_SUBJECT_DIR || '/subject' } },
  plugins: [vue(), vueJsx()],
  build: { outDir: `${process.env.IR_STATE_CACHE || '/state-cache'}/dist`, emptyOutDir: true },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, fs: { allow: ['/subject', process.env.IR_RUNTIME_ORACLE || '/oracle', '/tooling'] } },
}
