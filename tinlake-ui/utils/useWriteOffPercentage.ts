import { Loan } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { useQuery } from 'react-query'
import { useTinlake } from '../components/TinlakeProvider'

export function calculateWriteOffPercentage(borrowsAggregatedAmount: string, repaysAggregatedAmount: string) {
  try {
    return parseFloat(
      (
        new BN(repaysAggregatedAmount)
          .sub(new BN(borrowsAggregatedAmount))
          .mul(new BN(10000))
          .div(new BN(borrowsAggregatedAmount))
          .toNumber() / 100
      ).toFixed(2)
    )
  } catch {
    return 0
  }
}

export function useWriteOffPercentage(poolId: string, loanData: Loan) {
  const tinlake = useTinlake()

  return useQuery(
    ['writeOff', poolId, loanData?.loanId],
    async () => {
      const writeOffGroups = await tinlake.getWriteOffGroups()

      const has100PercentWriteOffGroup = writeOffGroups.some((writeOffGroup) =>
        // @ts-expect-error
        writeOffGroup.percentage?.value.isZero()
      )

      if (has100PercentWriteOffGroup) {
        const { borrowsAggregatedAmount, repaysAggregatedAmount } = loanData
        if (borrowsAggregatedAmount && repaysAggregatedAmount) {
          // @ts-expect-error
          return calculateWriteOffPercentage(borrowsAggregatedAmount, repaysAggregatedAmount)
        }
      }

      if (has100PercentWriteOffGroup === false) {
        return 0
      }
    },
    {
      enabled: !!loanData && !!poolId,
    }
  )
}
