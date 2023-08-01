import '@rainbow-me/rainbowkit/styles.css';

import {
  RainbowKitProvider,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import {
  arbitrum,
  hardhat,
  mainnet,
  optimism,
  polygon,
  zora,
} from 'wagmi/chains';

import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const walletConnectProjectId = '398e7f27d039fdf8e2fabe8d75af5b69'
export const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, zora, hardhat],
  [
    // alchemyProvider({ apiKey: process.env.ALCHEMY_ID }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  projectId: walletConnectProjectId,
  chains
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

