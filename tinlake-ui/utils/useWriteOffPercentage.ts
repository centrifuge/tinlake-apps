import { ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { useQuery } from 'react-query'
import { useTinlake } from '../components/TinlakeProvider'
import { BT_POOL_FEED_CONTRACTS } from './useAssetListWriteOffStatus'

export async function calculateWriteOffPercentage(tinlake: ITinlake, loanId: number) {
  try {
    if (BT_POOL_FEED_CONTRACTS.includes(tinlake.contractAddresses.FEED?.toLowerCase() as string)) {
      const isLoanWrittenOff = await tinlake.getIsLoanWrittenOff(loanId)

      if (isLoanWrittenOff) {
        return '100'
      }

      return '0'
    }

    const rateGroup = await tinlake.getRateGroup(loanId)

    if (rateGroup.lt(new BN(1000))) {
      return '0'
    }

    const writeOffPercentage = await tinlake.getWriteOffPercentage(rateGroup)

    if (writeOffPercentage.isZero()) {
      return '0'
    }

    return writeOffPercentage.div(new BN(10).pow(new BN(25))).toString()
  } catch (e) {
    console.log(`Oops: ${e}`)
    return '0'
  }
}

export function useWriteOffPercentage(poolId: string, loanId: number) {
  const tinlake = useTinlake()

  return useQuery(['writeOff', poolId, loanId], async () => calculateWriteOffPercentage(tinlake, loanId), {
    enabled: !!poolId && !!loanId,
  })
}
