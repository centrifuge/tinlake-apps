import { Anchor, Box, Card, Paragraph } from 'grommet'

export const ExpiringCFGRewardsBanner = () => {
  const expirationDate = new Date('2024-01-29T15:01')
  const currentDateCET = new Date().toLocaleString('en-US', { timeZone: 'CET' })
  const currentDateCETMillis = new Date(currentDateCET).getTime()

  const isExpired = currentDateCETMillis > expirationDate.getTime()

  const formattedExpirationDate = `${expirationDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${expirationDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).toLowerCase()}`

  return (
    <Card
      margin={{ top: 'medium' }}
      pad={{ top: 'xsmall', bottom: 'xsmall', left: 'medium', right: 'medium' }}
      style={{
        backgroundColor: '#fff5da',
      }}
    >
      <Box>
        <Paragraph>
          {isExpired ? (
            `CFG rewards expired on ${formattedExpirationDate} CET.`
          ) : (
            <>
              Claim your rewards until {formattedExpirationDate} CET. After this day, users will not be able to claim
              their CFG rewards. Check <Anchor href="/rewards" label="here" /> if there are still unclaimed rewards.
            </>
          )}{' '}
          Read more <Anchor href="https://gov.centrifuge.io/t/cp81-unclaimed-tinlake-rewards/5885/4" label="here" />.
        </Paragraph>
      </Box>
    </Card>
  )
}
