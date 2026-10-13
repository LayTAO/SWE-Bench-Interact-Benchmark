import path from 'node:path';
import { createRequire } from 'node:module';
const subject = process.env.SUBJECT_DIR;
const require = createRequire(path.join(subject, 'packages/react/package.json'));
const { default: react } = await import(require.resolve('@vitejs/plugin-react'));
const entries = {
  '@floating-ui/utils/dom': 'utils/src/dom.ts',
  '@floating-ui/react/utils': 'react/src/utils.ts',
  '@floating-ui/react': 'react/src/index.ts',
  '@floating-ui/react-dom': 'react-dom/src/index.ts',
  '@floating-ui/dom': 'dom/src/index.ts',
  '@floating-ui/core': 'core/src/index.ts',
  '@floating-ui/utils': 'utils/src/index.ts',
};
export default {
  root: path.dirname(new URL(import.meta.url).pathname), plugins: [react()],
  define: { __DEV__: true }, css: { postcss: { plugins: [] } },
  resolve: { alias: Object.entries(entries).map(([name, file]) => ({
    find: new RegExp('^' + name + '$'), replacement: path.join(subject, 'packages', file),
  })), dedupe: ['react', 'react-dom'] },
  build: { outDir: 'dist', emptyOutDir: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
};
