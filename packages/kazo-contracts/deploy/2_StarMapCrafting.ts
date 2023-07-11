import 'dotenv/config';

import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';
import { ArgoPetz } from '../typechain';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let argoPetz = await deployments.get('ArgoPetz');
  console.log('argoPetz.address', argoPetz.address);
  // Chain Dependent Settings
  if (chainId == '25') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    return;
  } else if (chainId == '338') {
    console.log('TESTNET DEPLOYMENT...');

    // Deploy StarmapCrafting
    let smCrafting = await deploy('StarMapCrafting', {
      from: deployer,
      log: true,
      args: [argoPetz.address],
    });
  } else if (chainId == '31337') {
    return;
  } else {
    return;
  }
};

module.exports.tags = ['StarMapCrafting'];
