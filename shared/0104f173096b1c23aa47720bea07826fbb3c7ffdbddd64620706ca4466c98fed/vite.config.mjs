import path from 'node:path';
import { defineConfig } from '/tooling/node_modules/vite/dist/node/index.js';
import react from '/tooling/node_modules/@vitejs/plugin-react/dist/index.js';

const radixSource = {
  name: 'interactrepair-radix-source-alias',
  resolveId(source) {
    if (!source.startsWith('@radix-ui/')) return null;
    const name = source.slice('@radix-ui/'.length);
    const group = name.startsWith('react-') ? 'react' : 'core';
    const directory = name.startsWith('react-') ? name.slice('react-'.length) : name;
    return `/subject/packages/${group}/${directory}/src/index.ts`;
  },
};

export default defineConfig({
  root: '/oracle',
  cacheDir: path.join('/state-cache', 'vite'),
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: '@interactrepair/dismissable-layer',
        replacement: '/subject/packages/react/dismissable-layer/src/index.ts'
      },
      {
        find: '@interactrepair/dialog',
        replacement: '/subject/packages/react/dialog/src/index.ts'
      },
      {
        find: '@interactrepair/dropdown-menu',
        replacement: '/subject/packages/react/dropdown-menu/src/index.ts'
      },
      {
        find: 'react/jsx-runtime',
        replacement: '/subject/node_modules/react/jsx-runtime.js'
      },
      {
        find: 'react/jsx-dev-runtime',
        replacement: '/subject/node_modules/react/jsx-dev-runtime.js'
      },
      {
        find: 'react-dom/client',
        replacement: '/subject/node_modules/react-dom/client.js'
      },
      {
        find: /^react-dom$/,
        replacement: '/subject/node_modules/react-dom/index.js'
      },
      {
        find: 'react',
        replacement: '/subject/node_modules/react/index.js'
      },
      {
        find: 'tslib',
        replacement: '/tooling/node_modules/tslib/tslib.es6.mjs'
      },
      {
        find: 'react-remove-scroll-bar/constants',
        replacement: '/subject/node_modules/.pnpm/react-remove-scroll-bar@2.3.8_@types+react@19.2.15_react@19.2.6/node_modules/react-remove-scroll-bar/dist/es2015/constants.js'
      },
      {
        find: 'use-callback-ref',
        replacement: '/subject/node_modules/.pnpm/use-callback-ref@1.3.3_@types+react@19.2.15_react@19.2.6/node_modules/use-callback-ref/dist/es2015/index.js'
      },
      {
        find: 'use-sidecar',
        replacement: '/subject/node_modules/.pnpm/use-sidecar@1.1.3_@types+react@19.2.15_react@19.2.6/node_modules/use-sidecar/dist/es2015/index.js'
      },
      {
        find: 'react-remove-scroll',
        replacement: '/subject/node_modules/.pnpm/react-remove-scroll@2.7.2_@types+react@19.2.15_react@19.2.6/node_modules/react-remove-scroll/dist/es2015/index.js'
      },
      {
        find: 'react-remove-scroll-bar',
        replacement: '/subject/node_modules/.pnpm/react-remove-scroll-bar@2.3.8_@types+react@19.2.15_react@19.2.6/node_modules/react-remove-scroll-bar/dist/es2015/index.js'
      },
      {
        find: 'react-style-singleton',
        replacement: '/subject/node_modules/.pnpm/react-style-singleton@2.2.3_@types+react@19.2.15_react@19.2.6/node_modules/react-style-singleton/dist/es2015/index.js'
      },
      {
        find: 'scheduler',
        replacement: '/subject/node_modules/.pnpm/scheduler@0.27.0/node_modules/scheduler/index.js'
      },
      {
        find: '@floating-ui/dom',
        replacement: '/subject/node_modules/.pnpm/@floating-ui+dom@1.7.6/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs'
      },
      {
        find: '@floating-ui/core',
        replacement: '/subject/node_modules/.pnpm/@floating-ui+core@1.7.5/node_modules/@floating-ui/core/dist/floating-ui.core.mjs'
      },
      {
        find: '@floating-ui/utils/dom',
        replacement: '/subject/node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs'
      },
      {
        find: '@floating-ui/utils',
        replacement: '/subject/node_modules/.pnpm/@floating-ui+utils@0.2.11/node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs'
      }
    ]
  },
  plugins: [radixSource, react({ jsxRuntime: 'classic', fastRefresh: false })],
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: { jsx: 'react', target: 'es2020', module: 'esnext' },
    }),
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  build: { outDir: '/state-cache/dist', emptyOutDir: true },
  server: {
    host: '0.0.0.0',
    port: 4175,
    strictPort: true,
    fs: { allow: ['/subject', '/oracle', '/tooling'] },
  },
});
