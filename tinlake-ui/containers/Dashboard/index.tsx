import { Spinner } from '@centrifuge/axis-spinner'
import * as React from 'react'
import { Box, Stack } from '../../components/Layout'
import PoolList from '../../components/PoolList'
import PoolsMetrics from '../../components/PoolsMetrics'
import TinlakeExplainer from '../../components/TinlakeExplainer'
import { IpfsPools } from '../../config'
import { usePools } from '../../utils/usePools'

interface Props {
  ipfsPools: IpfsPools
}

const Dashboard: React.FC<Props> = () => {
  const pools = usePools()

  return !pools.data ? (
    <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
  ) : (
    <Stack gap="xlarge" pt="xlarge">
      <Box display={['none', 'block']}>
        <TinlakeExplainer />
      </Box>

      <PoolsMetrics totalValue={pools.data.totalValue} />
      <PoolList poolsData={pools.data} />
    </Stack>
  )
}

export default Dashboard
