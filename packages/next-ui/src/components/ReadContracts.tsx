'use client'

import { stringify } from '../utils/stringify'
import { useContractReads } from 'wagmi'
import { wagmiContractConfig } from './contracts'

export function ReadContracts() {
  const { data, isSuccess, isLoading } = useContractReads({
    contracts: [
      {
        ...wagmiContractConfig,
        functionName: 'balanceOf',
        args: ['0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC'],
      },
      {
        ...wagmiContractConfig,
        functionName: 'name',
      },
      {
        ...wagmiContractConfig,
        functionName: 'totalSupply',
      },
    ],
  })

  return (
    <div>
      <div>Data:</div>
      {isLoading && <div>loading...</div>}
      {isSuccess &&
        data?.map((data) => <pre key={stringify(data)} style={{ whiteSpace: "pre-wrap" }}>{stringify(data)}</pre>)}
    </div>
  )
}
