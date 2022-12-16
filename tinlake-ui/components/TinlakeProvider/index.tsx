import * as React from 'react'
import { ContractAddresses, ContractVersions, ITinlake } from '../../../tinlake.js/dist'
import { initTinlake } from '../../services/tinlake'

interface TinlakeProviderProps {
  addresses?: ContractAddresses
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
  contractVersions?: ContractVersions
}

const TinlakeContext = React.createContext<ITinlake | null>(null)

export const useTinlake = (): ITinlake => {
  const ctx = React.useContext(TinlakeContext)
  if (!ctx) throw new Error('useTinlake must be used within TinlakeProvider')
  return ctx
}

export const TinlakeConsumer: React.FC<{ children: (tinlake: ITinlake) => React.ReactElement }> = ({ children }) => {
  return children(useTinlake())
}

export const TinlakeProvider: React.FC<TinlakeProviderProps> = ({
  children,
  addresses,
  contractConfig,
  contractVersions,
}) => {
  const tinlake = React.useMemo(
    () => initTinlake({ addresses, contractConfig, contractVersions }),
    [addresses, contractConfig, contractVersions]
  )

  return <TinlakeContext.Provider value={tinlake}>{children}</TinlakeContext.Provider>
}
