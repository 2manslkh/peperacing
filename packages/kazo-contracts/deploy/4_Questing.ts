import 'dotenv/config';

import { ethers } from 'hardhat';
import { Questing, Kazo, Minion } from '../typechain';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let kazo = await deployments.get('Kazo');
  let minion = await deployments.get('Minion');
  // Chain Dependent Settings
  if (chainId == '1') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    return;
  } else if (chainId == '5001') {
    console.log('TESTNET DEPLOYMENT...');

    // Deploy Questing
    let questing = await deploy('Questing', {
      from: deployer,
      log: true,
      args: [kazo, minion],
    });
  } else if (chainId == '31337') {
  } else {
    return;
  }
};

module.exports.tags = ['Questing'];
