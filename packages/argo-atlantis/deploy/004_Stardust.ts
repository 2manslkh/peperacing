import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { ethers } from 'hardhat';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let [owner] = await ethers.getSigners();
  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');

  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }

  let contract = await deploy('Stardust', {
    from: deployer,
    log: true,
    args: [registry.address],
  });

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getStardust');

    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setStardust', contract.address);
      console.log(`Stardust address changed from ${currentAddress} to ${contract.address}`);
    }
  }
};

//module.exports.dependencies = ['AtlantisAddressRegistry'];
module.exports.tags = ['Stardust', 'Phase1'];
