'use client'

import * as React from 'react'

import {
  RainbowKitProvider,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import { chains, config } from '../wagmi'

// import { ConnectKitProvider } from 'connectkit'
import { WagmiConfig } from 'wagmi'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>{mounted && children}</RainbowKitProvider>
    </WagmiConfig>
  )
}
