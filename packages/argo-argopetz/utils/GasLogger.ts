import { BigNumber, BigNumberish, Transaction, ethers } from 'ethers';

import { TransactionReceipt } from '@ethersproject/abstract-provider';
import csv from 'csv-parser';
import fs from 'fs';
import { network } from 'hardhat';

// import { Receipt } from "hardhat-deploy/dist/types";

let chainId: number = network.config.chainId ? network.config.chainId : 0;

const etherscan: any = {
  1: 'https://etherscan.io/tx/',
  4: 'https://rinkeby.etherscan.io/tx/',
  137: 'https://polygonscan.com/tx/',
  80001: 'https://mumbai.polygonscan.com/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  69: 'https://kovan-optimistic.etherscan.io/tx/',
  42161: 'https://explorer.arbitrum.io/tx/',
  421611: 'https://testnet.arbiscan.io/tx/',
  25: 'https://cronoscan.com/tx/',
  338: 'https://testnet.cronoscan.com/tx/',
};

export class GasLogger {
  totalGas: BigNumberish;
  totalEth: BigNumberish;

  constructor() {
    this.totalGas = ethers.parseEther('0');
    this.totalEth = ethers.parseEther('0');
  }

  addDeployment = (tx: any) => {
    console.log('----- DEPLOYMENT INFO -----');

    if (tx.address) console.log('✏️  Deployed To: ', tx.address);
    if (tx.receipt.transactionHash) {
      console.log('✏️  Tx Hash: ', tx.receipt.transactionHash);
    }
    if (etherscan[chainId]) {
      console.log(`${etherscan[chainId]}${tx.receipt.transactionHash}`);
    }
    if (tx.receipt.type) console.log('✏️  Transaction Type: ', tx.receipt.type);

    if (tx.receipt.gasUsed) {
      console.log('⛽ Gas Consumed: ', tx.receipt.gasUsed.toString());
      BigNumber.from(this.totalGas).add(tx.receipt.gasUsed);
    }
    if (tx.receipt.effectiveGasPrice)
      console.log('⛽ Gas Price: ', ethers.formatUnits(tx.receipt.effectiveGasPrice, 'gwei'), 'gwei');

    if (tx.receipt.effectiveGasPrice && tx.receipt.gasUsed) {
      console.log('Ξ Cost: ', ethers.formatEther(tx.effectiveGasPrice.mul(tx.gasUsed)), 'Ξ');
      console.log('Ξ Cost: ', ethers.formatEther(tx.receipt.effectiveGasPrice.mul(tx.receipt.gasUsed)), 'Ξ');
      BigNumber.from(this.totalEth).add(tx.receipt.effectiveGasPrice.mul(tx.receipt.gasUsed));
    }
    console.log();
  };

  addTransaction = (tx: any) => {
    console.log('----- TRANSACTION INFO -----');
    if (tx.transactionHash) {
      console.log('✏️  Tx Hash: ', tx.transactionHash);
    }
    if (etherscan[chainId]) {
      console.log(`${etherscan[chainId]}${tx.transactionHash}`);
    }
    console.log('✏️  Transaction Type: ', tx.type);
    console.log('⛽ Gas Consumed: ', tx.gasUsed.toString());
    console.log('⛽ Gas Price: ', ethers.formatUnits(tx.effectiveGasPrice, 'gwei'), 'gwei');
    console.log('Ξ Cost: ', ethers.formatEther(tx.effectiveGasPrice.mul(tx.gasUsed)), 'Ξ');

    BigNumber.from(this.totalGas).add(tx.gasUsed);
    BigNumber.from(this.totalEth).add(tx.effectiveGasPrice.mul(tx.gasUsed));
    console.log();
  };

  addProxyDeployment = (tx: any) => {
    console.log('----- DEPLOYMENT INFO -----');
    if (tx.address) console.log('✏️  Proxy Deployed To: ', tx.address);
    if (tx.implementation) console.log('✏️  Implementation Deployed To: ', tx.implementation);
    if (tx.transactionHash) {
      console.log('✏️  Tx Hash: ', tx.transactionHash);
    }
    if (etherscan[chainId]) {
      console.log(`${etherscan[chainId]}${tx.transactionHash}`);
    }
    if (tx.receipt.gasUsed) {
      console.log('⛽ Gas Consumed: ', tx.receipt.gasUsed);
      BigNumber.from(this.totalGas).add(tx.receipt.gasUsed);
    }
    if (tx.receipt.effectiveGasPrice && tx.receipt.gasUsed)
      BigNumber.from(this.totalEth).add(tx.receipt.effectiveGasPrice.mul(tx.receipt.gasUsed));
    console.log();
  };

  printGas = (tx: any) => {
    console.log('----- Gas INFO -----');
    console.log('⛽ Gas Consumed: ', tx.receipt.gasUsed.toString());
    console.log('⛽ Gas Price: ', tx.receipt.effectiveGasPrice.toString());
    console.log('Ξ Cost: ', ethers.formatEther(tx.receipt.effectiveGasPrice.mul(tx.receipt.gasUsed)), 'Ξ');
    console.log();
  };

  printTotal = () => {
    console.log('----- Total Gas INFO -----');
    console.log('⛽ Total Gas Consumed: ', this.totalGas.toString());
    console.log('Total Ξ Cost: ', ethers.formatEther(this.totalEth), 'Ξ');
    console.log();
  };
}
