import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const babel = require('@babel/core')
const flowStrip = require('@babel/plugin-transform-flow-strip-types')
const transformJsx = require('@babel/plugin-transform-react-jsx')

export default function legacyReactSource (runtime = 'classic') {
  return {
    name: 'interactrepair-legacy-react-source',
    enforce: 'pre',
    async transform (code, id) {
      // Vite may expose the same mounted checkout through its real path
      // (/workspace/subject) instead of the verifier alias (/subject).
      // Normalize both spellings before handing the filename to Babel so the
      // legacy JSX-in-.js transform is applied to the exact same source.
      const normalizedId = id.replace(/\/workspace\/subject(?=\/|$)/, '/subject')
      if ((!normalizedId.startsWith('/subject/') && !normalizedId.includes('/subject-')) || !normalizedId.endsWith('.js')) return null
      const result = await babel.transformAsync(code, {
        filename: normalizedId,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        plugins: [[flowStrip, { allowDeclareFields: true }], [transformJsx, { runtime }]],
      })
      return result ? { code: result.code, map: result.map } : null
    },
  }
}
