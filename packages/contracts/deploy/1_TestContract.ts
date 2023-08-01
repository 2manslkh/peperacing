import 'dotenv/config';

import { ethers } from 'hardhat';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deploy('Bank', {
    from: deployer,
    log: true,
    args: [],
  });
  await deploy('MockERC20', {
    from: deployer,
    log: true,
    args: [],
  });
  await deploy('MockERC721', {
    from: deployer,
    log: true,
    args: [],
  });


};

module.exports.tags = ['TestContract'];
