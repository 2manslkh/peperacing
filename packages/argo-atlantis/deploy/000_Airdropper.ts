import 'dotenv/config';

import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // Chain Dependent Settings
  let contract = await deploy('Airdropper', {
    from: deployer,
    args: [],
  });
};

module.exports.tags = ['Airdropper'];
