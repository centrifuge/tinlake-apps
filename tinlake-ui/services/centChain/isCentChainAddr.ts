import { Keyring } from '@polkadot/api'

export function isCentChainAddr(addr: string) {
  try {
    const keyring = new Keyring()
    const accountId = keyring.decodeAddress(addr, true)
    const accountId2 = keyring.decodeAddress(addr, false, 36)
    return accountId.every((b, i) => b === accountId2[i])
  } catch (e) {
    return false
  }
}
