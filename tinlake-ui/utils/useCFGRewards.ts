import BN from 'bn.js'
import { baseToDisplay } from '../../tinlake.js/dist'
import { addThousandsSeparators } from './addThousandsSeparators'
import { toDynamicPrecision } from './toDynamicPrecision'
import { useUserRewards } from './useUserRewards'

export function useCFGRewards() {
  const { data: userRewards } = useUserRewards()

  return {
    formattedAmount: addThousandsSeparators(
      toDynamicPrecision(baseToDisplay(userRewards?.totalEarnedRewards || '0', 18))
    ),
    amount: userRewards?.totalEarnedRewards || new BN(0),
  }
}
