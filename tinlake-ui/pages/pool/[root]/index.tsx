import { Box } from 'grommet'
import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../components/Auth'
import Container from '../../../components/Container'
import Header from '../../../components/Header'
import { IpfsPoolsProvider } from '../../../components/IpfsPoolsProvider'
import Overview from '../../../components/Overview'
import Archived from '../../../components/Overview/Archived'
import { TinlakeProvider } from '../../../components/TinlakeProvider'
import WithFooter from '../../../components/WithFooter'
import { ArchivedPool, IpfsPools, loadPoolsFromIPFS, Pool as LivePool, UpcomingPool } from '../../../config'
import { menuItems, noDemo } from '../../../menuItems'

interface Props {
  root: string
  pool: ArchivedPool | UpcomingPool | LivePool
  key: string
  ipfsPools: IpfsPools
}

const Pool: React.FC<Props> = ({ pool, ipfsPools }) => {
  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider
        addresses={'addresses' in pool ? pool.addresses : undefined}
        contractVersions={'versions' in pool ? pool.versions : undefined}
        contractConfig={'contractConfig' in pool ? pool.contractConfig : undefined}
      >
        <WithFooter>
          <Head>
            <title>Pool Overview: {pool.metadata.name} | Tinlake | Centrifuge</title>
          </Head>
          <Header
            ipfsPools={ipfsPools}
            poolTitle={pool.metadata.shortName || pool.metadata.name}
            selectedRoute={'/'}
            menuItems={'isArchived' in pool || !('addresses' in pool) ? [] : menuItems.filter(noDemo)}
          />
          <Container>
            <Box justify="center" direction="row">
              <Box width="xlarge">
                <Auth>
                  {'isArchived' in pool ? <Archived selectedPool={pool} /> : <Overview selectedPool={pool} />}
                </Auth>
              </Box>
            </Box>
          </Container>
        </WithFooter>
      </TinlakeProvider>
    </IpfsPoolsProvider>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // We'll pre-render only these paths at build time.
  const pools = await loadPoolsFromIPFS()
  let paths = pools.upcoming.map((pool) => ({ params: { root: pool.metadata.slug } }))
  const activePaths = pools.active.map((pool) => ({ params: { root: pool.metadata.slug } }))
  const archivePaths = pools.archived.map((pool) => ({ params: { root: pool.metadata.slug } }))
  paths = paths.concat(activePaths).concat(archivePaths)

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) {
    throw new Error(`Params are not passed`)
  }
  const pools = await loadPoolsFromIPFS()
  let pool: UpcomingPool | ArchivedPool | LivePool | undefined
  pool = pools.upcoming.find((p) => p.metadata.slug === params!.root)
  if (!pool) {
    pool = pools.archived.find((p) => p.metadata.slug === params!.root)
  }
  if (!pool) {
    pool = pools.active.find((p) => p.metadata.slug === params!.root)
  }
  if (!pool) {
    throw new Error(`Pool ${params.root} cannot be loaded`)
  }

  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { pool, root: params.root as string, key: pool.metadata.name || '-', ipfsPools: pools }

  return { props: newProps }
}

export default Pool
