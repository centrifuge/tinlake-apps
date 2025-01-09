export function networkIdToName(id: string) {
  switch (id) {
    case `0x1`:
      return 'Mainnet'
    case `0x2`:
      return 'Morden'
    case `0x3`:
      return 'Ropsten'
    case `0x4`:
      return 'Rinkeby'
    case `0x5`:
      return 'Goerli'
    case `0x2a`:
      return 'Kovan'
    case `0x64`:
      return 'XDai'
    case `0x63`:
      return 'Local'
  }
  return null
}

export function networkNameToId(name: string) {
  switch (name) {
    case 'Mainnet':
      return '0x1'
    case 'Morden':
      return '0x2'
    case 'Ropsten':
      return '0x3'
    case 'Rinkeby':
      return '0x4'
    case 'Goerli':
      return '0x5'
    case 'Kovan':
      return '0x2a'
    case 'XDai':
      return '0x64'
    case 'Local':
      return '0x63'
    default:
      return null
  }
}

export function networkUrlToName(url: string) {
  if (url.indexOf('eth.') > -1) return 'Mainnet'
  if (url.indexOf('morden') > -1) return 'Morden'
  if (url.indexOf('ropsten') > -1) return 'Ropsten;'
  if (url.indexOf('rinkeby') > -1) return 'Rinkeby'
  if (url.indexOf('goerli') > -1) return 'Goerli'
  if (url.indexOf('kovan') > -1) return 'Kovan'
  if (url.indexOf('xDai') > -1) return 'XDai'
  if (url.indexOf('localhost') > -1) return 'Local'
  return 'Mainnet'
}
