import path from 'node:path';

const subjectDir = process.env.SUBJECT_DIR;
const outputDir = process.env.OUTPUT_DIR;
if (!subjectDir) {
  throw new Error('SUBJECT_DIR must point to the exact radix-ui/primitives checkout');
}
if (!outputDir) {
  throw new Error('OUTPUT_DIR is required');
}

export default {
  cacheDir: path.join(outputDir, 'vite-cache'),
  resolve: {
    alias: [
      {
        find: '@interactrepair/dismissable-layer',
        replacement: '/subject/packages/react/dismissable-layer/src/index.ts'
      },
      {
        find: '@interactrepair/dialog',
        replacement: path.join(subjectDir, 'packages/react/dialog/src/index.ts')
      },
      {
        find: '@interactrepair/dropdown-menu',
        replacement: path.join(subjectDir, 'packages/react/dropdown-menu/src/index.ts')
      },
      {
        find: 'react/jsx-runtime',
        replacement: path.join(subjectDir, 'node_modules/react/jsx-runtime.js')
      },
      {
        find: 'react/jsx-dev-runtime',
        replacement: path.join(subjectDir, 'node_modules/react/jsx-dev-runtime.js')
      },
      {
        find: 'react-dom/client',
        replacement: path.join(subjectDir, 'node_modules/react-dom/client.js')
      },
      {
        find: 'react',
        replacement: path.join(subjectDir, 'node_modules/react/index.js')
      }
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 4175,
    strictPort: true
  }
};
