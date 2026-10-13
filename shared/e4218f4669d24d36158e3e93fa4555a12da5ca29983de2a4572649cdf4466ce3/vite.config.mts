import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  root: process.env.IR_RUNTIME_ORACLE || '.',
  plugins: [react()],
  resolve: {
    alias: {
      react: '/subject/node_modules/react',
      'react-dom': '/subject/node_modules/react-dom',
      '@patternfly/react-core/deprecated': '/subject/packages/react-core/src/deprecated/index.ts',
      '@patternfly/react-table/deprecated': '/subject/packages/react-table/src/deprecated/index.ts',
    },
  },
  build: { outDir: `${process.env.IR_STATE_CACHE || '/state-cache'}/dist`, emptyOutDir: true },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    fs: { allow: ['/subject', process.env.IR_RUNTIME_ORACLE || '/oracle', '/tooling'] },
  },
})
