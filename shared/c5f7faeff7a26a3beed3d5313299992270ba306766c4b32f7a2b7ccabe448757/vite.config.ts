import path from 'node:path'
import {fileURLToPath} from 'node:url'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

const appRoot = path.dirname(fileURLToPath(import.meta.url))
const subjectDir = process.env.SUBJECT_DIR

export default defineConfig({
  plugins: [react()],
  resolve: {
    ...(subjectDir ? {conditions: ['source']} : {}),
    alias: subjectDir
      ? {
          '@subject-calculate-position': path.resolve(
            subjectDir,
            'packages/@react-aria/overlays/src/calculatePosition.ts',
          ),
        }
      : {},
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: subjectDir ? ['@subject-calculate-position'] : [],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: {
      allow: subjectDir ? [appRoot, subjectDir] : [appRoot],
    },
  },
})
