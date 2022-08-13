import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import styled from 'styled-components'
import { GroupBy, Report } from '../pages/Pool/Reporting'
import { formatBalance, formatPrice, getCurrencySymbol } from '../utils/formatting'
import { useDailyPoolStates, useInvestorTransactions, useMonthlyPoolStates, usePoolMetadata } from '../utils/usePools'
import { Column, DataTable } from './DataTable'
import { DataTableGroup } from './DataTableGroup'

export type ReportingMoment = {
  blockNumber: number
  timestamp: Date
}

type Props = {
  pool: Pool
  report: Report
  exportRef: React.MutableRefObject<Function>
  groupBy: GroupBy
}

type TableDataRow = {
  name: string | React.ReactElement
  value: string[] | React.ReactElement
  heading?: boolean
}

export const ReportComponent: React.FC<Props> = ({ pool, report, exportRef, groupBy }) => {
  const { data: metadata } = usePoolMetadata(pool)

  const dailyPoolStates = useDailyPoolStates(pool.id) // , startDate, endDate
  const monthlyPoolStates = useMonthlyPoolStates(pool.id) // , startDate, endDate
  const poolStates = report === 'pool-balance' ? (groupBy === 'day' ? dailyPoolStates : monthlyPoolStates) : []
  const investorTransactions = useInvestorTransactions(pool.id)

  const columns: Column[] =
    report === 'pool-balance'
      ? poolStates
        ? [
            {
              align: 'left',
              header: '',
              cell: (row: TableDataRow) => <Text variant={row.heading ? 'heading4' : 'body2'}>{row.name}</Text>,
              flex: '1 0 200px',
            },
          ].concat(
            poolStates.map((state, index) => {
              return {
                align: 'right',
                header: `${new Date(state.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                })} ${
                  groupBy === 'day'
                    ? new Date(state.timestamp).toLocaleDateString('en-US', { day: 'numeric' })
                    : new Date(state.timestamp).toLocaleDateString('en-US', { year: 'numeric' })
                }`,
                cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
                flex: '0 0 100px',
              }
            })
          )
        : []
      : ['Account', 'Tranche', 'Epoch', 'Timestamp', 'Type', 'Amount (aUSD)', 'Amount (tokens)'].map((col, index) => {
          return {
            align: 'left',
            header: col,
            cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
            flex: '0 0 200px',
          }
        })

  const exportToCsv = () => {
    const rows = [columns.map((col) => col.header.toString())]

    const mapText = (text: string) => text.replaceAll('\u00A0 \u00A0', '-')

    overviewRecords.forEach((rec, index) => {
      rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
    })
    rows.push([''])

    priceRecords.forEach((rec, index) => {
      rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
    })
    rows.push([''])

    inOutFlowRecords.forEach((rec, index) => {
      rows.push(columns.map((col) => (col.cell(rec, index) ? mapText(textContent(col.cell(rec, index))) : '')))
    })
    rows.push([''])

    downloadCSV(rows, `pool-balance_${new Date().toISOString().slice(0, 10)}.csv`)
  }
  exportRef.current = exportToCsv

  const overviewRecords: TableDataRow[] = [
    {
      name: `Pool value`,
      value:
        poolStates?.map((state) => {
          return formatBalance(state.poolValue)
        }) || [],
      heading: false,
    },
  ].concat([
    {
      name: `Asset value`,
      value:
        poolStates?.map((state) => {
          return formatBalance(state.poolState.netAssetValue.toDecimal())
        }) || [],
      heading: false,
    },
    {
      name: `Reserve`,
      value:
        poolStates?.map((state) => {
          return formatBalance(state.poolState.totalReserve.toDecimal())
        }) || [],
      heading: false,
    },
  ])

  const priceRecords: TableDataRow[] = [
    {
      name: `Token price`,
      value: poolStates?.map(() => '') || [],
      heading: false,
    },
  ].concat(
    pool?.tranches
      .slice()
      .reverse()
      .map((token) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
          value:
            poolStates?.map((state) => {
              return state.tranches[token.id].price ? formatPrice(state.tranches[token.id].price!) : '1.000'
            }) || [],
          heading: false,
        }
      }) || []
  )

  const inOutFlowRecords: TableDataRow[] = [
    {
      name: `Investments`,
      value: poolStates?.map(() => '') || [],
      heading: false,
    },
  ].concat(
    pool?.tranches
      .slice()
      .reverse()
      .map((token) => {
        const trancheMeta = metadata?.tranches?.[token.id]
        return {
          name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
          value:
            poolStates?.map((state) => {
              return formatBalance(state.tranches[token.id].fulfilledInvestOrders.toDecimal())
            }) || [],
          heading: false,
        }
      }) || [],
    [
      {
        name: `Redemptions`,
        value: poolStates?.map(() => '') || [],
        heading: false,
      },
    ].concat(
      pool?.tranches
        .slice()
        .reverse()
        .map((token) => {
          const trancheMeta = metadata?.tranches?.[token.id]
          return {
            name: `\u00A0 \u00A0 ${trancheMeta?.name} tranche`,
            value:
              poolStates?.map((state) => {
                return formatBalance(state.tranches[token.id].fulfilledRedeemOrders.toDecimal())
              }) || [],
            heading: false,
          }
        }) || []
    )
  )

  const investorTxRecords: TableDataRow[] =
    investorTransactions?.map((tx) => {
      return {
        name: ``,
        value: [
          tx.accountId,
          tx.trancheId,
          tx.epochNumber,
          tx.timestamp.toISOString(),
          tx.type,
          formatBalance(tx.currencyAmount.toDecimal()),
          formatBalance(tx.tokenAmount.toDecimal()),
        ],
        heading: false,
      }
    }) || []

  return (
    <Stack gap="2">
      <Stack gap="3">
        <GradientOverlay>
          <DataTableGroup>
            {report === 'pool-balance' && (
              <>
                <DataTable data={overviewRecords} columns={columns} hoverable />
                <DataTable data={priceRecords} columns={columns} hoverable />
                <DataTable data={inOutFlowRecords} columns={columns} hoverable />
              </>
            )}
            {console.log(investorTransactions)}
            {report === 'investor-tx' && <DataTable data={investorTxRecords} columns={columns} hoverable />}
          </DataTableGroup>
        </GradientOverlay>
      </Stack>
      <Text variant="body3" color="textSecondary">
        All amounts are in {pool && getCurrencySymbol(pool.currency)}.
      </Text>
    </Stack>
  )
}

const GradientOverlay = styled.div`
  max-width: 960px;
  overflow: auto;
  background: linear-gradient(to right, #fff 20%, rgba(0, 0, 0, 0)),
    linear-gradient(to right, rgba(0, 0, 0, 0), #fff 80%) 0 100%, linear-gradient(to right, #000, rgba(0, 0, 0, 0) 20%),
    linear-gradient(to left, #000, rgba(0, 0, 0, 0) 20%);
  background-attachment: local, local, scroll, scroll;
`

function textContent(elem: any): string {
  if (!elem) {
    return ''
  }
  if (typeof elem === 'string') {
    return elem
  }
  const children = elem.props && elem.props.children
  if (children instanceof Array) {
    return children.map(textContent).join('')
  }
  return textContent(children)
}

export const downloadCSV = (rows: any[], filename: string) => {
  const csvContent = `data:text/csv;charset=utf-8,${rows.map((e) => e.join(';')).join('\n')}`
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', filename)
  document.body.appendChild(link) // Required for FF

  link.click()
}
