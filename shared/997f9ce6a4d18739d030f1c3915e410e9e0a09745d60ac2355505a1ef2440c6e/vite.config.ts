import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js'
import {defineConfig} from '/tooling/node_modules/vite/dist/node/index.js'
import path from 'node:path'
import fs from 'node:fs'

export default defineConfig({
  plugins: [
    {
      name: 'react-spectrum-parcel-intl-glob',
      enforce: 'pre',
      transform(code, id) {
        if (!id.startsWith('/subject/packages/') && !id.startsWith('/workspace/subject/packages/')) return
        const globImport = /import\s+(\w+)\s+from\s+(['"])([^'"]+\/\*\.json)\2\s*;?/g
        let changed = false
        const transformed = code.replace(globImport, (_match, name, _quote, pattern) => {
          changed = true
          const normalizedId = id.replace(/^\/workspace\/subject\//, '/subject/')
          const absolutePattern = path.posix.normalize(path.posix.join(path.posix.dirname(normalizedId), pattern))
          const directory = absolutePattern.slice(0, absolutePattern.indexOf('*'))
          const messages = Object.fromEntries(fs.readdirSync(directory).filter(file => file.endsWith('.json')).map(file => [file.slice(0, -5), JSON.parse(fs.readFileSync(path.posix.join(directory, file), 'utf8'))]))
          return `const ${name} = ${JSON.stringify(messages)};`
        })
        if (changed) return {code: transformed, map: null}
      },
    },
    react(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {find: 'react', replacement: '/subject/node_modules/react'},
      {find: 'react-dom', replacement: '/subject/node_modules/react-dom'},
      {find: /^react-aria-components\/src\/(.*)$/, replacement: '/subject/packages/react-aria-components/src/$1.tsx'},
      {find: /^@react-aria\/([^/]+)\/(.*)$/, replacement: '/subject/packages/@react-aria/$1/src/$2'},
      {find: /^@react-aria\/([^/]+)$/, replacement: '/subject/packages/@react-aria/$1/src/index.ts'},
      {find: /^react-aria\/(.*)$/, replacement: '/subject/packages/react-aria/src/$1'},
      {find: 'react-aria', replacement: '/subject/packages/react-aria/src/index.ts'},
      {find: /^react-stately\/(.*)$/, replacement: '/subject/packages/react-stately/src/$1'},
      {find: 'react-stately', replacement: '/subject/packages/react-stately/src/index.ts'},
      {find: /^@react-stately\/([^/]+)\/(.*)$/, replacement: '/subject/packages/@react-stately/$1/src/$2'},
      {find: /^@react-stately\/([^/]+)$/, replacement: '/subject/packages/@react-stately/$1/src/index.ts'},
      {find: /^@internationalized\/([^/]+)$/, replacement: '/subject/packages/@internationalized/$1/index.ts'},
      {find: /^@react-types\/([^/]+)$/, replacement: '/subject/packages/@react-types/$1/src/index.ts'},
    ],
  },
  server: {host: '0.0.0.0', port: 4173, strictPort: true, fs: {allow: ['/subject', '/oracle-src', '/tooling']}},
  build: {outDir: '/state-cache/dist', emptyOutDir: true},
})
