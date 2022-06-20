import { Balance, Perquintill } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'

const currencySymbols = {
  native: 'AIR',
  usd: 'kUSD',
  permissionedeur: 'pEUR',
}

export function getCurrencySymbol(currency?: string) {
  return (currency && currencySymbols[currency.toLowerCase() as keyof typeof currencySymbols]) || currency || ''
}

export function formatBalance(amount: Balance | Decimal | number, currency?: string, precision = 0) {
  const formattedAmount = (
    amount instanceof Balance ? amount.toFloat() : amount instanceof Decimal ? amount.toNumber() : amount
  ).toLocaleString('en', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
  return currency ? `${formattedAmount} ${getCurrencySymbol(currency)}` : formattedAmount
}

export function formatBalanceAbbreviated(amount: Balance | Decimal | number, currency?: string, decimals = 1) {
  const amountNumber =
    amount instanceof Balance ? amount.toFloat() : amount instanceof Decimal ? amount.toNumber() : amount
  let formattedAmount = ''
  if (amountNumber > 999 && amountNumber < 1e6) {
    formattedAmount = `${(amountNumber / 1e3).toFixed(decimals)}K`
  } else if (amountNumber > 1e6) {
    formattedAmount = `${(amountNumber / 1e6).toFixed(decimals)}M`
  } else if (amountNumber <= 999) {
    formattedAmount = `${amountNumber.toFixed(decimals)}`
  }
  return currency ? `${formattedAmount} ${getCurrencySymbol(currency)}` : formattedAmount
}

export function formatPercentage(amount: Perquintill | Decimal | number, includeSymbol = true) {
  const formattedAmount = (
    amount instanceof Perquintill
      ? amount.toPercent().toNumber()
      : amount instanceof Decimal
      ? amount.toNumber()
      : amount
  ).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return includeSymbol ? `${formattedAmount}%` : formattedAmount
}

export function roundDown(float: Decimal | number, precision: number = 2) {
  return Math.floor((float instanceof Decimal ? float.toNumber() : float) * 10 ** precision) / 10 ** precision
}
