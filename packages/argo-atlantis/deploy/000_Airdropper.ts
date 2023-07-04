import 'dotenv/config';

import { ethers } from 'hardhat';

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
