import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { AtlantisRacing } from '../typechain/contracts/AtlantisRacing';
import { ethers } from 'hardhat';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');

  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }

  let contract = await deploy('Gold', {
    from: deployer,
    log: true,
    args: [],
  });

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getGold');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setGold', contract.address);
      console.log(`Gold address changed from ${currentAddress} to ${contract.address}`);
    }
  }
};

//module.exports.dependencies = ['AtlantisAddressRegistry'];
module.exports.tags = ['Phase1', 'Gold'];
