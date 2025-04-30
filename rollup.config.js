// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const config = {
  input: {
    main: 'src/main.js',
    post: 'src/post.js'
  },
  output: {
    esModule: true,
    dir: 'dist',
    format: 'es',
    sourcemap: false,
    entryFileNames: '[name].js'
  },
  plugins: [commonjs(), nodeResolve({ preferBuiltins: true })]
}

export default config
