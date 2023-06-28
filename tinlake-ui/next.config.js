require('dotenv').config()
require('ts-node').register({ project: './tsconfig.json', compilerOptions: { module: 'CommonJS' }, files: true })
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
    // Further custom configuration here
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
