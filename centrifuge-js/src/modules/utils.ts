import { SubmittableExtrinsic } from '@polkadot/api/types'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { CentrifugeBase } from '../CentrifugeBase'

Decimal.set({
  precision: 28,
  toExpNeg: -7,
  toExpPos: 29,
  rounding: Decimal.ROUND_HALF_CEIL,
})

const secondsPerYear = new Decimal(60 * 60 * 24 * 365)

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

export function getUtilsModule(inst: CentrifugeBase) {
  function toRate(rate: number) {
    return new BN(rate * 10 ** 6).mul(new BN(10).pow(new BN(27 - 6))).toString()
  }

  function toPerquintill(rate: number) {
    return new BN(rate * 10 ** 6).mul(new BN(10).pow(new BN(18 - 6))).toString()
  }

  function aprToFee(apr: number) {
    const i = new Decimal(apr)
    const fee = i.div(secondsPerYear).plus(1).mul('1e27').toDecimalPlaces(0)
    return fee.toString()
  }

  function feeToApr(fee: string | BN) {
    let feeToConvert = fee
    if (typeof feeToConvert !== 'string' && typeof feeToConvert !== 'number') {
      feeToConvert = feeToConvert.toString()
    }

    if (feeToConvert.toString() === '0') {
      return feeToConvert.toString()
    }

    const i = new Decimal(feeToConvert).div('1e27').minus(1).times(secondsPerYear)
    return i.mul(100).toDecimalPlaces(2).toString()
  }

  function baseToDisplay(base: string | BN, decimals: number): string {
    let baseStr = typeof base === 'string' ? base : base.toString()
    const neg = baseStr.includes('-')

    baseStr = baseStr.replace(/-/g, '')

    const a = baseStr.slice(0, -decimals) || '0'
    const b = baseStr.slice(-decimals).padStart(decimals, '0')

    const res = `${a}.${b}`

    return neg ? `-${res}` : res
  }

  function toPrecision(value: string, precision: number) {
    const zero = new Decimal('0').toFixed(precision)
    const result = new Decimal(value.toString()).toFixed(precision)

    // If value >= 0.0 but will be rounded to 0.0, round up.
    // Otherwise, 183542 base units as precision 18 will be rounded to 0.00.
    if (zero === result) return new Decimal(value.toString()).toFixed(precision, Decimal.ROUND_UP)

    return result
  }

  // regex from https://stackoverflow.com/a/2901298/6694848
  function addThousandsSeparators(x: string | BN | number) {
    const parts = x.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  }

  function formatCurrencyAmount(bn: BN | string | undefined, currency?: string) {
    const currencyStr = currency || 'Usd'
    if (!bn) return ''
    return `${addThousandsSeparators(toPrecision(baseToDisplay(new BN(bn), 18), 0))} ${currencyStr}`
  }

  function formatPercentage(numerator: BN | string | undefined, denominator: BN | string | undefined) {
    if (!numerator || !denominator) return ''
    const a = new BN(numerator).div(new BN(1e6))
    let b = new BN(denominator).div(new BN(1e6))
    b = b.isZero() ? new BN(1) : b
    const percentage = (parseInt(a.toString(), 10) / parseInt(b.toString(), 10)) * 100
    return `${percentFormatter.format(percentage)}%`
  }

  function formatRatio(ratio: BN | undefined) {
    if (!ratio) return ''
    return `${addThousandsSeparators(toPrecision(baseToDisplay(ratio || '0', 27), 4))}`
  }

  // TODO: this doesn't work yet
  async function batch(submittables: Promise<any>[]) {
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll(
      await Promise.all(submittables as unknown as SubmittableExtrinsic<'promise'>[])
    )
    return inst.wrapSignAndSend(api, submittable)
  }

  return {
    toRate,
    toPerquintill,
    aprToFee,
    feeToApr,
    formatCurrencyAmount,
    formatPercentage,
    formatRatio,
    batch,
  }
}