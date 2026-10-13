import {defineConfig, transformWithEsbuild} from 'vite';

export default defineConfig({
  server: {watch: null},
  define: {__DEV__: 'true'},
  plugins: [{
    name: 'carbon-source-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (id.includes('/packages/react/src/') && id.endsWith('.js')) {
        return transformWithEsbuild(code, id, {loader: 'jsx', jsx: 'automatic'});
      }
      return null;
    },
  }],
  optimizeDeps: {
    entries: ['.interactrepair-repro/index.html'],
    esbuildOptions: {loader: {'.js': 'jsx'}},
  },
});
