import 'dotenv/config';

import { ethers } from 'hardhat';
import { Kazo, KazoStaking } from '../typechain';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let kazo = await deployments.get('Kazo');
  // Chain Dependent Settings
  if (chainId == '8453') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    return;
  } else if (chainId == '84531') {
    console.log('TESTNET DEPLOYMENT...');
  } else if (chainId == '31337') {
  } else {
    return;
  }

  let staking = await deploy('KazoStaking', {
    from: deployer,
    log: true,
    args: [kazo.address],
  });
};

module.exports.tags = ['KazoStaking'];
