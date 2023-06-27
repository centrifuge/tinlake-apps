import { default as init, default as Onboard } from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'
import ledgerModule from '@web3-onboard/ledger'
import portisModule from '@web3-onboard/portis'
import walletConnectModule from '@web3-onboard/walletconnect'
import config from '../../config'

type Onboard = ReturnType<typeof init>

const injected = injectedModule()
const portis = portisModule({
  apiKey: config.portisApiKey,
})
const ledger = ledgerModule()
const walletConnect = walletConnectModule({ projectId: 'e56e37e297013fe8064af18b0361c3e4', version: 2 })

let onboard: Onboard | null = null

// initOnboard returns onboard singleton. Onboard is only initialized once and stored in global state.
export async function initOnboard(): Promise<Onboard> {
  if (onboard) {
    return onboard
  }

  onboard = init({
    wallets: [injected, ledger, walletConnect, walletConnect, portis],
    chains: [
      {
        id: '1',
        token: 'ETH',
        label: 'Ethereum Mainnet',
        rpcUrl: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
      },
      {
        id: '5',
        token: 'goerliETH',
        label: 'Ethereum Goerli Testnet',
        rpcUrl: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
      },
    ],
    appMetadata: {
      name: 'Select a Wallet',
      icon: '<svg>My App Icon</svg>',
      description: 'Please select a wallet to connect to this dapp:',
      recommendedInjectedWallets: [{ name: 'MetaMask', url: 'https://metmask.io/' }],
    },
    accountCenter: {
      mobile: {
        enabled: false,
      },
      desktop: {
        enabled: false,
      },
    },
  })
  return onboard
}

export function getOnboard(): Onboard | null {
  return onboard
}
