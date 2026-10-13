import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.env.SUBJECT_DIR, 'package.json'));
const kitRoot = path.dirname(require.resolve('@sveltejs/kit/package.json'));
const { svelte, vitePreprocess } = await import(path.join(kitRoot, '../vite-plugin-svelte/src/index.js'));
const { preprocessMeltUI } = await import(require.resolve('@melt-ui/pp'));

export default {
  root: path.dirname(new URL(import.meta.url).pathname),
  plugins: [svelte({ configFile: false, preprocess: [preprocessMeltUI(), vitePreprocess()] })],
  resolve: { alias: { $lib: path.join(process.env.SUBJECT_DIR, 'src/lib') }, dedupe: ['svelte'] },
  css: { postcss: { plugins: [] } },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
};
