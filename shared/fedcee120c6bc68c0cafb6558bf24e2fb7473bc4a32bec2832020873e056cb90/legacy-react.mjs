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
      if (!id.startsWith('/subject/') || !id.endsWith('.js')) return null
      const result = await babel.transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        plugins: [[flowStrip, { allowDeclareFields: true }], [transformJsx, { runtime }]],
      })
      return result ? { code: result.code, map: result.map } : null
    },
  }
}
