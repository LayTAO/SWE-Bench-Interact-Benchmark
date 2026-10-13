export default {
  root: process.env.IR_RUNTIME_ORACLE || '.',
  resolve: { alias: {
    '/subject': process.env.IR_SUBJECT_DIR || '/subject',
    '@mantine/hooks': `${process.env.IR_SUBJECT_DIR || '/subject'}/packages/@mantine/hooks/src/index.ts`,
    '@mantine/core': `${process.env.IR_SUBJECT_DIR || '/subject'}/packages/@mantine/core/src/index.ts`,
    '@mantine/utils': `${process.env.IR_SUBJECT_DIR || '/subject'}/packages/@mantine/utils/src/index.ts`,
    '@mantine/store': `${process.env.IR_SUBJECT_DIR || '/subject'}/packages/@mantine/store/src/index.ts`,
  } },
  build: { outDir: `${process.env.IR_STATE_CACHE || '/state-cache'}/dist`, emptyOutDir: true },
  server: { host: '0.0.0.0', port: 4173, strictPort: true, fs: { allow: ['/subject', process.env.IR_RUNTIME_ORACLE || '/oracle', '/tooling'] } },
}
