import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const subject = process.env.SUBJECT_DIR;
const require = createRequire(path.join(subject, 'package.json'));
const { default: vue } = await import(require.resolve('@vitejs/plugin-vue'));
const { default: vueJsx } = await import(require.resolve('@vitejs/plugin-vue-jsx'));
export default {
  root: path.dirname(fileURLToPath(import.meta.url)),
  plugins: [vue(), vueJsx()],
  resolve: { alias: [{ find: /^@element-plus\/(components|constants|directives|hooks|locale|theme-chalk|utils)(\/.*)?$/, replacement: subject + '/packages/$1$2' }], dedupe: ['vue'] },
  css: { postcss: { plugins: [] } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
};
