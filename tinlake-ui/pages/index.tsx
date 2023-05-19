import { Anchor, Box, Card, Heading, Paragraph } from 'grommet'
import { GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import * as React from 'react'
import Auth from '../components/Auth'
import { Button } from '../components/Button'
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

const ExploreCentrifugeBanner = () => {
  const router = useRouter()

  return (
    <Card margin={{ top: 'medium', bottom: 'medium' }}>
      <Box pad="medium">
        <Heading level="5" margin={{ top: 'xxsmall', bottom: 'small' }}>
          Tinlake is moving to Centrifuge
        </Heading>
        <Box>
          <Paragraph>
            We want to inform you that the current version of our app will soon be phased out. We have been working
            tirelessly to bring you an enhanced and improved experience, and we are thrilled to announce that a new
            version of our app is now available at <Anchor href="https://app.centrifuge.io" label="app.centrifuge.io" />
            . The new version comes with a host of exciting features and improvements that we believe will greatly
            enhance your usage. We have listened to your feedback and incorporated many of your suggestions to make the
            app more intuitive, user-friendly, and efficient.
          </Paragraph>
          <Paragraph>
            We understand that change can sometimes be challenging, but we assure you that the new version is worth the
            transition. Our team has put in considerable effort to ensure a smooth migration process, and we will be
            available to assist you throughout the transition period. If you have any questions or encounter any
            difficulties during the migration process, please don’t hesitate to reach out to our support team at{' '}
            <Anchor href="mailto:support@centrifuge.io" label="support@centrifuge.io" />. We are here to help and ensure
            that your experience with our app remains seamless.
          </Paragraph>
        </Box>

        <Button
          label="Explore Centrifuge"
          primary
          onClick={() => router.push('https://app.centrifuge.io')}
          margin={{ left: 'auto', top: 'medium' }}
        />
      </Box>
    </Card>
  )
}

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
