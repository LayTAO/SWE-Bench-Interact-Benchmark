import path from 'node:path';
import {defineConfig, transformWithEsbuild} from 'vite';

export default defineConfig({
  define: {__DEV__: 'true'},
  resolve: {
    alias: {
      '@carbon/icons-react': path.resolve('.interactrepair-repro/icons-stub.jsx'),
      '@carbon/feature-flags': path.resolve('.interactrepair-repro/feature-flags-stub.js'),
    },
  },
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
