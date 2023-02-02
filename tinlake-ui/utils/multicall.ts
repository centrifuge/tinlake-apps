import { aggregate } from '@makerdao/multicall'
import set from 'lodash/set'
import { multicallConfig } from '../config'

type PostProcess<T = any> = (v: any) => T

type Return = [string] | [string, PostProcess]

export interface Call {
  target: string
  call: (string | number)[]
  returns: Return[]
}

export async function multicall<T = any>(calls: Call[]): Promise<T> {
  const filteredCalls = calls.filter((call) => call.target !== '0xcAB9ed8e5EF4607A97f4e22Ad1D984ADB93ce890')

  const {
    results: { transformed: multicallData },
  } = await aggregate(filteredCalls, multicallConfig)

  const transformed = Object.entries(multicallData).reduce((obj, [type, value]) => {
    set(obj, type, value)
    return obj
  }, {} as any)

  return transformed
}
