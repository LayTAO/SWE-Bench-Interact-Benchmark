import {transformAsync} from '@babel/core'
import transformGlobImport from 'babel-plugin-transform-glob-import'

export default function legacyReactSource(runtime = 'classic') {
  return {
    name: 'interactrepair-legacy-react-source',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.startsWith('/subject/') || !/\.(?:js|jsx|ts|tsx)$/.test(id)) return null
      const isTypeScript = /\.tsx?$/.test(id)
      const result = await transformAsync(code, {
        filename: id,
        sourceMaps: true,
        babelrc: false,
        configFile: false,
        presets: [],
        plugins: [
          transformGlobImport,
          isTypeScript
            ? ['@babel/plugin-transform-typescript', {isTSX: id.endsWith('.tsx'), allExtensions: true, allowDeclareFields: true}]
            : ['@babel/plugin-transform-flow-strip-types', {allowDeclareFields: true}],
          ['@babel/plugin-transform-react-jsx', {runtime}],
        ],
      })
      return result ? {code: result.code, map: result.map} : null
    },
  }
}
