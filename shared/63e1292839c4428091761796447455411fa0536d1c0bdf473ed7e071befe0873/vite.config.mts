export default {
  root: process.env.IR_RUNTIME_ORACLE || '.',
  resolve: { alias: { '/subject': process.env.IR_SUBJECT_DIR || '/subject' } },
  build: { outDir: `${process.env.IR_STATE_CACHE || '/state-cache'}/dist`, emptyOutDir: true },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, fs: { allow: ['/subject', process.env.IR_RUNTIME_ORACLE || '/oracle', '/tooling'] } },
}
