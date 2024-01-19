import { Anchor, Box, Card, Paragraph } from 'grommet'

export const ExploreCentrifugeBanner = () => (
  <Card
    margin={{ top: 'medium', bottom: 'xsmall' }}
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
