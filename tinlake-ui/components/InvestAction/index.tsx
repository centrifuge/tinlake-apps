import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { Pool, UpcomingPool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { useAddress } from '../../utils/useAddress'
import { useInvestorOnboardingState } from '../../utils/useOnboardingState'
import { usePool } from '../../utils/usePool'
import { Button } from '../Button'
import { Tooltip } from '../Tooltip'

interface Props {
  pool: Pool | UpcomingPool
  tranche?: 'junior' | 'senior'
}

const InvestAction: React.FC<Props> = (props) => {
  const { data: investorOnboardingData } = useInvestorOnboardingState()
  const [awaitingConnectAndData, setAwaitingConnectAndData] = React.useState(false)
  const address = useAddress()
  const router = useRouter()
  const dispatch = useDispatch()

  const { data: poolData } = usePool(
    props.pool && 'addresses' in props.pool ? props.pool.addresses?.ROOT_CONTRACT : undefined
  )

  const hasPoolData = props.pool ? !!poolData : true
  const hasUserData = address ? !!investorOnboardingData : true
  const hasData = hasPoolData && hasUserData

  const isUpcoming = poolData?.isUpcoming
  const isLaunching = poolData?.isLaunching
  const hasDoneKYC = investorOnboardingData?.completed
  const canInvestInPool =
    props.pool && props.tranche
      ? poolData?.[props.tranche]?.inMemberlist
      : poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist

  function navigate() {
    if (!isUpcoming && hasDoneKYC && canInvestInPool) {
      const basePath = `/pool/${(props.pool as Pool).addresses.ROOT_CONTRACT}/${props.pool?.metadata.slug}`
      router.push(`${basePath}/investments`)
    }
  }

  async function connectAndNavigate() {
    if (!address) {
      setAwaitingConnectAndData(true)
      try {
        await dispatch(ensureAuthed())
      } catch (e) {
        console.log('caught', e)
        setAwaitingConnectAndData(false)
      }
      return
    }
    if (!hasData) {
      setAwaitingConnectAndData(true)
      return
    }

    navigate()
  }

  React.useEffect(() => {
    if (awaitingConnectAndData && address && hasData) {
      setAwaitingConnectAndData(false)
      navigate()
    }
  }, [address, hasData, awaitingConnectAndData])

  return (
    <>
      {isUpcoming && address && hasDoneKYC ? (
        <Tooltip title="Upcoming pool" description="This upcoming pool is not open for investments yet">
          <Button primary label="Invest" disabled />
        </Tooltip>
      ) : isLaunching && address ? (
        <Tooltip
          title="Launching pool"
          description="This pool is launching with with existing investors while ramping up the portfolio. If you are interested in investing once the pool opens, please contact the issuer."
        >
          <Button primary label="Invest" disabled />
        </Tooltip>
      ) : (
        !isUpcoming && hasDoneKYC && canInvestInPool && <Button primary label="Invest" onClick={connectAndNavigate} />
      )}
    </>
  )
}

export default InvestAction
