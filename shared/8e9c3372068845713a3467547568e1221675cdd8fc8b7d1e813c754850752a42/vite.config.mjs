import path from 'node:path';

const subjectDir = process.env.SUBJECT_DIR;
const outputDir = process.env.OUTPUT_DIR;
if (!subjectDir) throw new Error('SUBJECT_DIR is required');
if (!outputDir) throw new Error('OUTPUT_DIR is required');

export default {
  root: '/app',
  cacheDir: path.join(outputDir, 'vite-cache'),
  resolve: {
    alias: [
      {
        find: '@interactrepair/list-option',
        replacement: path.join(
          subjectDir,
          'packages/nimble-components/dist/esm/list-option/index.js'
        )
      },
      {
        find: '@interactrepair/select',
        replacement: path.join(
          subjectDir,
          'packages/nimble-components/dist/esm/select/index.js'
        )
      }
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 4174,
    strictPort: true,
    fs: { strict: false }
  }
};
