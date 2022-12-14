import { TokenInput } from '@centrifuge/axis-token-input'
import { addThousandsSeparators, baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { Box, Button, Heading } from 'grommet'
import * as React from 'react'
import { connect } from 'react-redux'
import { useTinlake } from '../../../components/TinlakeProvider'
import { Pool } from '../../../config'
import { createTransaction, TransactionProps, useTransactionState } from '../../../ducks/transactions'
import { usePool } from '../../../utils/usePool'
import { Description } from './styles'

interface Props extends TransactionProps {
  selectedPool?: Pool
  setShowMaxReserveForm: (value: boolean) => void
}

const e27 = new BN(10).pow(new BN(27))

const MaxReserveForm: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: poolData, refetch: refetchPoolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const [value, setValue] = React.useState<string | undefined>(undefined)

  const onChange = (newValue: string) => {
    setValue(newValue)
  }

  const [creditlineValue, setCreditlineValue] = React.useState<string | undefined>(undefined)

  const onChangeCreditline = (newValue: string) => {
    setCreditlineValue(newValue)
  }

  const [status, , setTxId] = useTransactionState()
  const [creditlineStatus, , setCreditlineTxId] = useTransactionState()

  const mat = poolData?.maker?.mat

  const changedMaxReserve = value && value !== (poolData?.reserve || new BN(0)).toString()
  const changedCreditline = creditlineValue && mat && creditlineValue !== poolData?.maker?.creditline?.toString()

  const save = async () => {
    if (changedMaxReserve && value) {
      const txId = await props.createTransaction(`Set max reserve`, 'setMaxReserve', [tinlake, value.toString()])
      setTxId(txId)
    }

    if (changedCreditline && creditlineValue) {
      const currentCreditline = poolData?.maker?.creditline?.toString()
      const amount = new BN(creditlineValue).gt(new BN(currentCreditline))
        ? new BN(creditlineValue).sub(new BN(currentCreditline))
        : new BN(currentCreditline).sub(new BN(creditlineValue))
      const valueToDecimal = new Decimal(baseToDisplay(creditlineValue, 18)).toDecimalPlaces(4)
      const formatted = addThousandsSeparators(valueToDecimal.toString())

      if (new BN(creditlineValue).gt(new BN(currentCreditline))) {
        const txId = await props.createTransaction(`Increase credit line to ${formatted}`, 'raiseCreditline', [
          tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      } else {
        const txId = await props.createTransaction(`Lower credit line to ${formatted}`, 'sinkCreditline', [
          tinlake,
          amount.toString(),
        ])
        setCreditlineTxId(txId)
      }
    }
  }

  React.useEffect(() => {
    if (status === 'succeeded') {
      refetchPoolData()
      props.setShowMaxReserveForm(false)
    }
  }, [status])

  // TODO: refactor
  const debtCeiling = (poolData?.maker?.line || new BN('0')).div(new BN(10).pow(new BN(45 - 18)))
  const maxRaise = mat
    ? (poolData?.netAssetValue || new BN(0))
        .add(poolData?.reserveAndRemainingCredit || new BN(0))
        .mul(e27.sub(poolData?.minJuniorRatio || new BN(0)))
        .div(e27)
        .sub(poolData?.senior?.debt || new BN(0))
        .sub(poolData?.senior?.balance || new BN(0))
        .div(
          (mat || new BN(0))
            .sub(e27)
            .sub(e27)
            .mul(e27.sub(poolData?.minJuniorRatio || new BN(0)))
            .div(e27)
            .add(e27)
            .div(new BN(10).pow(new BN(27 - 18)))
        )
        .mul(new BN(10).pow(new BN(27 + 18)))
        .div(mat || new BN(0))
    : new BN(0)

  const maxCreditline = (poolData?.maker?.creditline || new BN(0)).add(maxRaise)

  return (
    <Box>
      <Heading level="5" margin={{ top: '0', bottom: '0' }}>
        Set maximum reserve amount
      </Heading>
      <Description margin={{ top: 'small' }}>
        This will determine how much can be invested into the reserve right now.
      </Description>
      <TokenInput
        token={props.selectedPool?.metadata.currencySymbol || 'DAI'}
        value={value === undefined ? poolData?.maxReserve.toString() || '0' : value}
        onChange={onChange}
        disabled={status === 'pending' || status === 'unconfirmed'}
      />
      {mat && (
        <>
          <Heading level="5" margin={{ top: 'large', bottom: '0' }}>
            Set Maker credit line
          </Heading>
          <Description margin={{ top: 'small' }}>
            This will lock in the required TIN for overcollateralization.
          </Description>
          <TokenInput
            token={props.selectedPool?.metadata.currencySymbol || 'DAI'}
            value={creditlineValue === undefined ? poolData?.maker?.creditline?.toString() || '0' : creditlineValue}
            onChange={onChangeCreditline}
            maxValue={(maxCreditline.lt(debtCeiling) ? maxCreditline : debtCeiling).toString()}
            limitLabel={maxCreditline.lt(debtCeiling) ? 'Max' : 'Debt Ceiling'}
            disabled={creditlineStatus === 'pending' || creditlineStatus === 'unconfirmed'}
          />
        </>
      )}
      <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
        <Button
          label="Cancel"
          onClick={() => props.setShowMaxReserveForm(false)}
          disabled={
            (changedMaxReserve && (status === 'pending' || status === 'unconfirmed')) ||
            (changedCreditline && (creditlineStatus === 'pending' || creditlineStatus === 'unconfirmed'))
          }
        />
        <Button
          primary
          label="Set"
          onClick={save}
          disabled={
            (!changedMaxReserve && !changedCreditline) ||
            (changedMaxReserve && (status === 'pending' || status === 'unconfirmed')) ||
            (changedCreditline &&
              (creditlineStatus === 'pending' ||
                creditlineStatus === 'unconfirmed' ||
                (creditlineValue ? new BN(creditlineValue).gt(debtCeiling) : true)))
          }
        />
      </Box>
    </Box>
  )
}

export default connect((state) => state, { createTransaction })(MaxReserveForm)
