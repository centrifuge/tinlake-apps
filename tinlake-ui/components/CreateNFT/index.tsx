import { baseToDisplay, displayToBase } from '@centrifuge/tinlake-js'
import { Box, Button, DateInput, FormField } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { ensureAuthed } from '../../ducks/auth'
import { createTransaction, useTransactionState } from '../../ducks/transactions'
import { Card } from '../Card'
import { Grid } from '../Layout'
import NumberInput from '../NumberInput'
import { useTinlake } from '../TinlakeProvider'

const CreateNFT: React.FC = () => {
  const DAYS = 24 * 60 * 60 * 1000
  const tinlake = useTinlake()
  const dispatch = useDispatch()
  const router = useRouter()

  const [value, setValue] = React.useState('')
  const [riskGroup, setRiskGroup] = React.useState('1')
  const [maturityDate, setMaturityDate] = React.useState(new Date(Date.now() + 30 * DAYS).toISOString())

  const [txStatus, , setTxId, tx] = useTransactionState()

  React.useEffect(() => {
    if (txStatus !== 'succeeded') return
    const logs = tx!.logs
      ?.map((log) => {
        try {
          return tinlake.contracts.ACTIONS!.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .filter(Boolean)
    const loanId = logs?.find((log) => log?.name === 'Lock')?.args.loan.toString()
    if (loanId) {
      const { root, slug } = router.query
      router.push(
        `/pool/[root]/[slug]/assets/asset?assetId=${loanId}`,
        `/pool/${root}/${slug}/assets/asset?assetId=${loanId}`,
        { shallow: true }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txStatus])

  async function handleCreate() {
    await dispatch(ensureAuthed())

    const id = dispatch(
      createTransaction(`Mint NFT...`, 'proxyBorrowerMintIssuePrice', [
        tinlake,
        tinlake.contractAddresses.MINTER!,
        tinlake.contractAddresses.ASSET_NFT!,
        value,
        riskGroup,
        Math.floor(new Date(maturityDate).getTime() / 1000),
      ])
    ) as any

    setTxId(id)
  }

  const isPending = !!txStatus && ['unconfirmed', 'pending'].includes(txStatus)
  const label = !isPending ? 'Create NFT' : `${txStatus === 'unconfirmed' ? 'signing' : 'pending'}...`

  return (
    <Box>
      <Card p="medium" my="medium">
        {txStatus === 'succeeded' ? (
          <Box>NFT Created</Box>
        ) : (
          <>
            <Box direction="row" justify="between" gap="large" margin={{ bottom: 'small' }}>
              <b>Please enter the NFT information below to create the NFT</b>

              <Button onClick={handleCreate} primary label={label} disabled={isPending} />
            </Box>

            <Grid columns={[1, 2]} equalColumns gap={100} maxWidth={700}>
              <FormField
                label={
                  tinlake.contractAddresses['LEGACY_ACTIONS']
                    ? 'Collateral Value'
                    : 'NFT Value / Max draw down (in USD)'
                }
              >
                <NumberInput
                  suffix=" USD"
                  value={baseToDisplay(value, 18)}
                  precision={18}
                  onValueChange={({ value }) => setValue(displayToBase(value, 18))}
                  disabled={isPending}
                />
              </FormField>
              <FormField label="Risk Group">
                <NumberInput
                  value={riskGroup}
                  onValueChange={({ value }) => setRiskGroup(value)}
                  precision={0}
                  disabled={isPending}
                />
              </FormField>
              {tinlake.contractAddresses['LEGACY_ACTIONS'] && (
                <FormField label="Maturity Date">
                  <DateInput
                    format="mm/dd/yyyy"
                    value={maturityDate}
                    onChange={(event: any) => {
                      console.log(event.value)
                      setMaturityDate(event.value)
                    }}
                    disabled={isPending}
                  />
                </FormField>
              )}
            </Grid>
          </>
        )}
      </Card>
    </Box>
  )
}

export default CreateNFT
