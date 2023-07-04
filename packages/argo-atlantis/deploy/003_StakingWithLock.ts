import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { Gold } from '../typechain/contracts/Gold';
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

  let contract = await deploy('StakingWithLock', {
    from: deployer,
    log: true,
    proxy: {
      owner: deployer,
      proxyContract: 'OptimizedTransparentProxy',
      execute: {
        init: {
          methodName: '__StakingWithLock_init',
          args: [deployer, registry.address],
        },
      },
    },
  });

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getStakingWithLock');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setStakingWithLock', contract.address);
      console.log(`StakingWithLock address changed from ${currentAddress} to ${contract.address}`);
    }
  }
};

//module.exports.dependencies = ['AtlantisAddressRegistry'];
module.exports.tags = ['Phase1', 'StakingWithLock'];
