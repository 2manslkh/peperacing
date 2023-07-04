import 'dotenv/config';

import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }
  let contract = await deploy('AtlantisAddressRegistry', {
    from: deployer,
    log: true,
    args: [],
  });
};

module.exports.tags = ['AtlantisAddressRegistry'];
