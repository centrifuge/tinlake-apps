import { Anchor, Box, Card, Paragraph } from 'grommet'

export const ExpiringCFGRewardsBanner = () => {
  const expirationDate = new Date('2024-01-29T15:01')
  const currentDateCET = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
  const currentDateCETMillis = new Date(currentDateCET).getTime()

  const isExpired = currentDateCETMillis > expirationDate.getTime()

  if (isExpired) return null

  const formattedExpirationDate = `${expirationDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${expirationDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).toLowerCase()}`

  return (
    <Card
      margin={{ top: 'medium', bottom: 'xsmall' }}
      pad={{ top: 'xsmall', bottom: 'xsmall', left: 'medium', right: 'medium' }}
      style={{
        backgroundColor: '#fff5da',
      }}
    >
      <Box>
        <Paragraph>
          Claim your Tinlake Rewards before it is too late. Rewards will expire on {formattedExpirationDate} CET. After
          the deadline, users will not be able to claim their CFG rewards. Check{' '}
          <Anchor href="/rewards" label="here" target="_blank" /> if you have unclaimed rewards. Read more about the
          community vote{' '}
          <Anchor
            href="https://gov.centrifuge.io/t/cp81-unclaimed-tinlake-rewards/5885/4"
            label="here"
            target="_blank"
          />
          .
        </Paragraph>
      </Box>
    </Card>
  )
}
