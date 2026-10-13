const subject = process.env.SUBJECT_DIR;
if (!subject) throw new Error('SUBJECT_DIR is required');
const app = `${subject}/.harbor-canonical-repro`;

export default {
  root: app,
  cacheDir: `${app}/.vite`,
  resolve: {
    preserveSymlinks: true,
    alias: [
      { find: '@zag-js/date-picker', replacement: `${subject}/packages/machines/date-picker/src/index.ts` },
      { find: '@zag-js/react', replacement: `${subject}/packages/frameworks/react/src/index.ts` },
      { find: '@floating-ui/core', replacement: `${subject}/node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core` },
      { find: '@floating-ui/dom', replacement: `${subject}/node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom` },
      { find: '@floating-ui/utils', replacement: `${subject}/node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils` },
      { find: 'scheduler', replacement: `${subject}/node_modules/.pnpm/scheduler@0.27.0/node_modules/scheduler/index.js` },
    ],
  },
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'scheduler'] },
  server: {
    strictPort: true,
    fs: { allow: [subject, app] },
  },
};
