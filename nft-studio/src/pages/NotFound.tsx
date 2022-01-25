import { AnchorButton, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { usePools } from '../utils/usePools'

export const NotFoundPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const { data: pools } = usePools()
  const location = useLocation()
  console.log('pools', pools)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader title="Page not found" />
      <Stack alignItems="center" gap="4">
        <Text variant="label1">The page {location.pathname} does not exist</Text>
        <AnchorButton variant="outlined" href="/">
          Go to the home page
        </AnchorButton>
      </Stack>
    </Stack>
  )
}
