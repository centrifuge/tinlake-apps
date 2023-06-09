import { Anchor, Box, Card, Paragraph } from 'grommet'
import { GetStaticProps } from 'next'
import * as React from 'react'
import Auth from '../components/Auth'
import Container from '../components/Container'
import Header from '../components/Header'
import { IpfsPoolsProvider } from '../components/IpfsPoolsProvider'
import { TinlakeProvider } from '../components/TinlakeProvider'
import WithFooter from '../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS } from '../config'
import Dashboard from '../containers/Dashboard'

interface Props {
  ipfsPools: IpfsPools
}

const ExploreCentrifugeBanner = () => (
  <Card
    margin={{ top: 'medium' }}
    pad={{ top: 'xsmall', bottom: 'xsmall', left: 'medium', right: 'medium' }}
    style={{
      backgroundColor: '#cde5ff',
    }}
  >
    <Box>
      <Paragraph>
        Tinlake is no longer supported. Please proceed to the new Centrifuge app at{' '}
        <Anchor href="https://app.centrifuge.io" label="app.centrifuge.io" />.
      </Paragraph>
    </Box>
  </Card>
)

const Home: React.FC<Props> = (props: Props) => {
  return (
    <IpfsPoolsProvider value={props.ipfsPools}>
      <TinlakeProvider>
        <WithFooter>
          <Header selectedRoute={''} menuItems={[]} ipfsPools={props.ipfsPools} />
          <Container style={{ backgroundColor: '#f9f9f9' }}>
            <Box justify="center" direction="row">
              <Box width="xlarge">
                <Auth>
                  <ExploreCentrifugeBanner />
                  <Dashboard ipfsPools={props.ipfsPools} />
                </Auth>
              </Box>
            </Box>
          </Container>
        </WithFooter>
      </TinlakeProvider>
    </IpfsPoolsProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ipfsPools = await loadPoolsFromIPFS()
  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { ipfsPools }
  return { props: newProps }
}

export default Home
