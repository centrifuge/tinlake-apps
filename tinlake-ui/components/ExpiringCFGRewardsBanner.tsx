import { Anchor, Box, Card, Paragraph } from 'grommet'

export const ExpiringCFGRewardsBanner = () => (
  <Card
    margin={{ top: 'medium' }}
    pad={{ top: 'xsmall', bottom: 'xsmall', left: 'medium', right: 'medium' }}
    style={{
      backgroundColor: '#fff5da',
    }}
  >
    <Box>
      <Paragraph>
        Claim your rewards until 29/01/2024 3:01pm CET. After this day, users will not be able to claim their CFG
        rewards. Check <Anchor href="/rewards" label="here" /> if there are still unclaimed rewards. Read more{' '}
        <Anchor href="https://gov.centrifuge.io/t/cp81-unclaimed-tinlake-rewards/5885/4" label="here" />.
      </Paragraph>
    </Box>
  </Card>
)
