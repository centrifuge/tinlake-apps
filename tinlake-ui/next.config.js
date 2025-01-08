require('dotenv').config()
require('@swc/register')({
  module: { type: 'commonjs' },
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    target: 'es2017',
  },
})
const withTM = require('next-transpile-modules')([
  '@web3-onboard/injected-wallets',
  '@web3-onboard/core',
  '@web3-onboard/common',
  '@web3-onboard/ledger',
  '@web3-onboard/portis',
  '@web3-onboard/walletconnect',
  '@web3-onboard/react',
])

module.exports = withTM({
  webpack(config) {
    config.devtool = false

    return {
      ...config,
      module: {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
          },
        ],
      },
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          child_process: false,
          net: false,
        },
      },
    }
  },
  experimental: {
    exportTrailingSlash: false,
  },
})
