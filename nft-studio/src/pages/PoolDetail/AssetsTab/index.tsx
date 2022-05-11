import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { LoanList } from '../../../components/LoanList'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { Tooltips } from '../../../components/Tooltips'
import { Dec } from '../../../utils/Decimal'
import { formatBalance, formatPercentage } from '../../../utils/formatting'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { useLoans } from '../../../utils/useLoans'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailAssetsTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const PoolDetailAssets: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const loans = useLoans(poolId)
  const history = useHistory()
  const avgMaturity = useAverageMaturity(poolId)

  if (!pool || !loans) return null

  const ongoingAssets = loans.filter((asset) => asset.status === 'Active')

  const avgInterestRatePerSec = ongoingAssets
    ?.reduce<any>((curr, prev) => curr.add(prev.interestRatePerSec.toAprPercent()), Dec(0))
    .dividedBy(ongoingAssets?.length)
    .toDecimalPlaces(2)
    .toString()

  const avgAmount = ongoingAssets
    ?.reduce<any>((curr, prev) => curr.add(prev.outstandingDebt.toDecimal()), Dec(0))
    .dividedBy(ongoingAssets?.length)
    .toDecimalPlaces(2)
    .toString()

  const pageSummaryData = [
    { label: <Tooltips type="ongoingAssets" />, value: ongoingAssets?.length || 0 },
    { label: <Tooltips type="averageAssetMaturity" />, value: avgMaturity },
    { label: <Tooltips type="averageFinancingFee" />, value: formatPercentage(avgInterestRatePerSec) },
    { label: <Tooltips type="averageAmount" />, value: formatBalance(avgAmount, pool.currency) },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData} />
      <PageSection title="Assets">
        {loans.length ? (
          <LoanList
            loans={ongoingAssets}
            onLoanClicked={(loan) => {
              history.push(`/pools/${pool.id}/assets/${loan.id}`)
            }}
          />
        ) : (
          <Text>No assets have been originated yet</Text>
        )}
      </PageSection>
    </>
  )
}
