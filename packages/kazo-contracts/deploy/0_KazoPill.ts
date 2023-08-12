import 'dotenv/config';

import { ethers } from 'hardhat';
import { Leader } from '../typechain';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let baseURI;
  // Chain Dependent Settings
  if (chainId == '8453') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    let kazoPill = await deploy('KazoPill', {
      from: deployer,
      log: true,
      args: ['KAZO Pill', 'PILL', ethers.parseEther('0.0005'), 1, deployer],
    });
    return;
  } else if (chainId == '84531') {
    console.log('TESTNET DEPLOYMENT...');
    // Deploy Pill
    let kazoPill = await deploy('KazoPill', {
      from: deployer,
      log: true,
      args: ['Test', 'TESTSYMBOL', ethers.parseEther('0.0005'), 1, deployer],
    });
  } else if (chainId == '31337') {
    // Deploy Leader
    let kazoPill = await deploy('KazoPill', {
      from: deployer,
      log: true,
      args: ['Test', 'Test Symbol'],
    });
  } else {
    return;
  }
};

module.exports.tags = ['Pill'];
