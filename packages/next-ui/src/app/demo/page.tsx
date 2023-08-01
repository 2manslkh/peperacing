'use client'

import { Account } from '../../components/Account'
import { Balance } from '../../components/Balance'
import { BlockNumber } from '../../components/BlockNumber'
import ButtonComponent from '../../components/Buttons/DeployContractButton'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Connected } from '../../components/Connected'
import { DeployContractButton } from '../../components/Buttons'
import { MintNFT } from '../../components/MintNFT'
import { NFTInventory } from '../../components/NFTInventory'
import { NetworkSwitcher } from '../../components/NetworkSwitcher'
import { ReadContract } from '../../components/ReadContract'
import { ReadContracts } from '../../components/ReadContracts'
import { ReadContractsInfinite } from '../../components/ReadContractsInfinite'
import { SendTransaction } from '../../components/SendTransaction'
import { SendTransactionPrepared } from '../../components/SendTransactionPrepared'
import { SignMessage } from '../../components/SignMessage'
import { SignTypedMessageWidget } from '../../components/SignTypedMessageWidget'
import TextInput from '../../components/Inputs/TextInput'
import { Token } from '../../components/Token'
import { TopNavBar } from '../../components/Navbar'
import { WatchContractEvents } from '../../components/WatchContractEvents'
import { WatchPendingTransactions } from '../../components/WatchPendingTransactions'
import { WriteContract } from '../../components/WriteContract'
import { WriteContractPrepared } from '../../components/WriteContractPrepared'
import { useState } from 'react'

export function Page() {


  return (
    <Connected>
      <SignMessage />
      <hr />
      <SignTypedMessageWidget />
      <hr />
      <MintNFT />
      <hr />
      <NFTInventory />
      <hr />
      {/* <FaucetWidget />
      <hr />
      <BankWidget />
      <hr />
      <DepositWidget />
      <hr />
      <WithdrawWidget />
      <hr /> */}

    </Connected>
  )
}

export default Page
