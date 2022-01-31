import BN from 'bn.js'
import { aggregateByYear, calculateFIFOCapitalGains, Operation } from 'fifo-capital-gains-js'
import { csvName } from '.'
import { downloadCSV } from '../../../utils/export'
import { PoolData } from '../../../utils/usePool'
import {
  calculateCostInUsd,
  date,
  formatDateOnly,
  getAllTokenPrices,
  getAllTransactions,
  getAllTransfers,
} from './util'

const tokenSymbolIsJunior = (symbol: string) => symbol.slice(symbol.length - 3) === 'TIN'
const e27 = new BN(10).pow(new BN(27))

function onlyUnique(value: any, index: number, self: any) {
  return self.indexOf(value) === index
}

const sumTransactionFees = (orders: any[]) => {
  return orders.reduce((sum: number, order: any) => {
    const costInUsd = calculateCostInUsd(order.gasPrice, order.gasUsed, order.timestamp)
    return sum + costInUsd
  }, 0)
}

const getBalanceOnFirstDay = (executionsBeforeYearStart: any[]) => {
  return executionsBeforeYearStart.reduce((balance: number, result: any) => {
    const amount = new BN(result.currencyAmount).div(new BN(10).pow(new BN(18))).toNumber()
    if (result.type === 'INVEST_EXECUTION') return balance + amount
    return balance - amount
  }, 0)
}

const calculateRealizedCapitalGains = (
  executions: any[],
  transfersFrom: any[],
  transfersTo: any[],
  investor: string,
  yearStart: Date
) => {
  if (executions.length === 0) return 0

  let totalBought = 0
  let largeAdjustment = false
  const operations: Operation[] = [
    ...executions.map((execution) => {
      let tokenAmount = new BN(execution.currencyAmount)
        .mul(e27)
        .div(new BN(execution.tokenPrice))
        .div(new BN(10).pow(new BN(18)))
        .toNumber()

      if (execution.type === 'INVEST_EXECUTION') {
        totalBought += tokenAmount
      }

      if (execution.type === 'REDEEM_EXECUTION') {
        if (totalBought - tokenAmount < 0) {
          // This ensures that we don't try to sell more than we buy, which can be caused by issues with token prices being slightly off
          console.log(`Adjusting ${tokenAmount} to ${totalBought}: ${tokenAmount - totalBought}`)
          if (tokenAmount - totalBought > 5) largeAdjustment = true
          tokenAmount = totalBought
          totalBought = 0
        } else {
          totalBought = totalBought - tokenAmount
        }
      }

      return {
        amount: tokenAmount,
        date: date(execution.timestamp),
        price: new BN(execution.tokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
        symbol: execution.symbol,
        type: execution.type === 'INVEST_EXECUTION' ? 'BUY' : 'SELL',
      } as Operation
    }),
    ...transfersFrom.map((transfer) => {
      const tokenPrice = tokenSymbolIsJunior(transfer.token.symbol)
        ? transfer.pool.juniorTokenPrice
        : transfer.pool.seniorTokenPrice

      return {
        amount: new BN(transfer.amount).div(new BN(10).pow(new BN(18))).toNumber(),
        date: date(transfer.timestamp),
        price: new BN(tokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
        symbol: transfer.token.symbol,
        type: 'SELL',
      } as Operation
    }),
    ...transfersTo.map((transfer) => {
      const tokenPrice = tokenSymbolIsJunior(transfer.token.symbol)
        ? transfer.pool.juniorTokenPrice
        : transfer.pool.seniorTokenPrice

      return {
        amount: new BN(transfer.amount).div(new BN(10).pow(new BN(18))).toNumber(),
        date: date(transfer.timestamp),
        price: new BN(tokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
        symbol: transfer.token.symbol,
        type: 'BUY',
      } as Operation
    }),
  ]

  if (largeAdjustment) {
    console.log(investor)
    console.log(executions)
    console.log(operations)
    console.log('\n')
  }

  try {
    // if (investor === '0x00397d81c4b005e86df0492fd468891ad2153377') {
    //   console.log(executions)
    //   console.log(transfersFrom)
    //   console.log(transfersTo)
    //   console.log(operations)
    // }
    return aggregateByYear(calculateFIFOCapitalGains(operations))
  } catch (e) {
    console.error(e)
    const year = yearStart.getFullYear()
    return { [year]: 0 }
  }
}

const calculateInterestAccrued = (
  executions: any[],
  symbol: string,
  tokenPriceFirstDay: number,
  tokenPriceLastDay: number,
  yearStart: Date,
  yearEnd: Date
) => {
  if (executions.length === 0) {
    const year = yearStart.getFullYear()
    return {
      balanceOnFirstDay: 0,
      balanceOnLastDay: 0,
      interestAccrued: { [year]: 0 },
    }
  }
  const executionsBeforeYearStart = executions.filter((result) => date(result.timestamp) < yearStart)
  const balanceOnFirstDay = getBalanceOnFirstDay(executionsBeforeYearStart)

  let totalBought = 0
  const operations: Operation[] = executions.map((execution) => {
    let tokenAmount =
      execution.type === 'INVEST_EXECUTION'
        ? new BN(execution.tokenAmount).div(new BN(10).pow(new BN(18))).toNumber()
        : new BN(execution.currencyAmount)
            .mul(e27)
            .div(new BN(execution.tokenPrice))
            .div(new BN(10).pow(new BN(18)))
            .toNumber()

    if (execution.type === 'INVEST_EXECUTION') {
      totalBought += tokenAmount
    }

    if (execution.type === 'REDEEM_EXECUTION') {
      if (totalBought - tokenAmount < 0) {
        // This ensures that we don't try to sell more than we buy, which can be caused by issues with token prices being slightly off
        console.log(`Adjusting ${tokenAmount} to ${totalBought}: ${tokenAmount - totalBought}`)
        tokenAmount = totalBought
        totalBought = 0
      } else {
        totalBought = totalBought - tokenAmount
      }
    }

    return {
      amount: tokenAmount,
      date: date(execution.timestamp),
      price: new BN(execution.tokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
      symbol: execution.symbol,
      type: execution.type === 'INVEST_EXECUTION' ? 'BUY' : 'SELL',
    }
  })

  const balanceOnLastDay = operations.reduce((last: number, operation: Operation) => {
    if (operation.type === 'BUY') return last + operation.amount
    return last - operation.amount
  }, 0)

  // Add a buy order on the first day of the year, with the balance at the start
  const operationsAggregratedYearStart =
    balanceOnFirstDay > 0
      ? [
          {
            symbol,
            amount: balanceOnFirstDay,
            date: yearStart,
            price: tokenPriceFirstDay,
            type: 'BUY',
          } as Operation,
          ...operations.filter((op) => op.date >= yearStart),
        ]
      : operations

  // Add a sell order at the end of the year, to assume everything was sold
  const operationsWithAssumedYearEndSale =
    balanceOnLastDay <= 0
      ? operationsAggregratedYearStart
      : [
          ...operationsAggregratedYearStart,
          {
            symbol,
            amount: balanceOnLastDay,
            date: yearEnd,
            price: tokenPriceLastDay,
            type: 'SELL',
          } as Operation,
        ]
  try {
    return {
      balanceOnFirstDay,
      balanceOnLastDay,
      interestAccrued: aggregateByYear(calculateFIFOCapitalGains(operationsWithAssumedYearEndSale)),
    }
  } catch (e) {
    console.error(e)
    const year = yearStart.getFullYear()
    return {
      balanceOnFirstDay,
      balanceOnLastDay,
      interestAccrued: { [year]: 0 },
    }
  }
}

async function taxReportByYear({ poolId, taxYear }: { poolId: string; poolData: PoolData; taxYear: number }) {
  const yearStart = new Date(taxYear, 0, 1)
  const yearEnd = new Date(taxYear, 11, 31)

  const transactions = await getAllTransactions(poolId)
  const symbols = transactions.map((tx) => tx.symbol).filter(onlyUnique)

  const transfers = await getAllTransfers(poolId)

  const tokenPrices = await getAllTokenPrices(poolId)
  const tokenPricesByDay = tokenPrices.reduce((prev: any, result: any) => {
    return {
      ...prev,
      ...{
        [formatDateOnly(date(result.day.id)).toString()]: {
          senior: new BN(result.seniorTokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
          junior: new BN(result.juniorTokenPrice).div(new BN(10).pow(new BN(27 - 6))).toNumber() / 10 ** 6,
        },
      },
    }
  }, {})
  const tokenPricesYearStart =
    formatDateOnly(yearStart) in tokenPricesByDay && tokenPricesByDay[formatDateOnly(yearStart)] !== '0'
      ? tokenPricesByDay[formatDateOnly(yearStart)]
      : { senior: 1.0, junior: 1.0 }
  console.log(tokenPricesByDay)
  console.log(formatDateOnly(yearEnd))
  const tokenPricesYearEnd =
    formatDateOnly(yearEnd) in tokenPricesByDay && tokenPricesByDay[formatDateOnly(yearEnd)] !== '0'
      ? tokenPricesByDay[formatDateOnly(yearEnd)]
      : Object.values(tokenPricesByDay).length > 0
      ? Object.values(tokenPricesByDay)[Object.values(tokenPricesByDay).length - 1] // TODO: this should not take the last element
      : { senior: 1.0, junior: 1.0 }

  console.log(`DROP token price started at ${tokenPricesYearStart.senior} and ended at ${tokenPricesYearEnd.senior}`)
  console.log(`TIN token price started at ${tokenPricesYearStart.junior} and ended at ${tokenPricesYearEnd.junior}`)

  // Get all investors who had a non-zero balance before year end
  const investors = transactions
    .filter((tx) => tx.type === 'INVEST_EXECUTION' || tx.type === 'REDEEM_EXECUTION')
    .filter((result) => date(result.timestamp) <= yearEnd)
    .map((tx) => tx.owner.id)
    .filter(onlyUnique)

  const rows: any = [
    [
      'ETH account',
      'Token',
      'Realized capital gains',
      'Interest accrued',
      'Transaction fees paid',
      'Balance Jan 1',
      'Balance Dec 31',
    ],
  ]
  symbols.forEach((symbol) => {
    investors.forEach((investor) => {
      // Get all the executions until the end of the year (including the years before, to get all buy ordres)
      const executions = transactions
        .filter((tx) => tx.symbol === symbol && tx.owner.id === investor)
        .filter((tx) => tx.type === 'INVEST_EXECUTION' || tx.type === 'REDEEM_EXECUTION')
        .filter((tx) => date(tx.timestamp) <= yearEnd)

      // And get all relevant tx for fees
      // TODO: add collect tx
      const orders = transactions
        .filter((tx) => tx.symbol === symbol && tx.owner.id === investor)
        .filter((tx) => tx.type === 'INVEST_ORDER' || tx.type === 'REDEEM_ORDER')
        .filter((result) => date(result.timestamp) >= yearStart && date(result.timestamp) <= yearEnd)

      const transfersFrom = transfers.filter((transfer) => transfer.from === investor)
      const transfersTo = transfers.filter((transfer) => transfer.to === investor)

      if (executions.length === 0 && transfersFrom.length === 0 && transfersTo.length === 0) {
        return
      }

      const realizedCapitalGains: any = calculateRealizedCapitalGains(
        executions,
        transfersFrom,
        transfersTo,
        investor,
        yearStart
      )
      const { interestAccrued, balanceOnFirstDay, balanceOnLastDay } = calculateInterestAccrued(
        executions,
        symbol,
        tokenPricesYearStart[tokenSymbolIsJunior(symbol) ? 'junior' : 'senior'],
        tokenPricesYearEnd[tokenSymbolIsJunior(symbol) ? 'junior' : 'senior'],
        yearStart,
        yearEnd
      ) as any
      const transactionFees = sumTransactionFees(orders)
      rows.push([
        investor,
        symbol,
        realizedCapitalGains['2021'] || 0,
        interestAccrued['2021'] || 0,
        transactionFees,
        balanceOnFirstDay,
        balanceOnLastDay,
      ])
    })
  })

  downloadCSV(rows, csvName(`Tax Report ${taxYear}`))

  return true
}

export function taxReport2020({ poolId, poolData }: { poolId: string; poolData: PoolData }) {
  return taxReportByYear({ poolId, poolData, taxYear: 2020 })
}

export function taxReport2021({ poolId, poolData }: { poolId: string; poolData: PoolData }) {
  return taxReportByYear({ poolId, poolData, taxYear: 2021 })
}
