import { Anchor, Box, Card, Paragraph } from 'grommet'

export const ExpiredCFGRewardsBanner = () => {
  const expirationDate = new Date('2024-01-29T15:01')
  const currentDateCET = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
  const currentDateCETMillis = new Date(currentDateCET).getTime()

  const isExpired = currentDateCETMillis > expirationDate.getTime()

  if (isExpired) {
    const formattedExpirationDate = `${expirationDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${expirationDate
      .toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      .toLowerCase()}`

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
            The Tinlake Reward program has been discontinued by community vote. All unclaimed CFG rewards expired on{' '}
            {formattedExpirationDate} CET and can no longer be collected. Read more about the community vote{' '}
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

  return null
}
