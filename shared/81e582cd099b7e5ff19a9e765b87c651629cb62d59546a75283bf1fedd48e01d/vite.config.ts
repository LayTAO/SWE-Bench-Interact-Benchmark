import {candidateWorkspace} from './candidate-workspace.mjs'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [candidateWorkspace(), react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
})
