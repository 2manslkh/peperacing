import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { ethers } from 'hardhat';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let TOTAL_STARDUST_PER_SECOND;
  let SEASON_END_TIME;

  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');
  let argonautsCount = [];
  let argonautsMultiplier = [];
  for (let i = 0; i < 6; i++) {
    argonautsCount.push(0 + i);
    argonautsMultiplier.push(10 + i);
  }
  // Chain Dependent Settings
  if (chainId == '25') {
    TOTAL_STARDUST_PER_SECOND = ethers.utils.parseEther('1.5');
    // Get current block timestamp
    const block = await ethers.provider.getBlock('latest');
    const blockTimestamp = block.timestamp;
    SEASON_END_TIME = blockTimestamp + 60 * 60 * 24 * 365;
  } else if (chainId == '338') {
    TOTAL_STARDUST_PER_SECOND = ethers.utils.parseEther('1.5');
    // Get current block timestamp
    const block = await ethers.provider.getBlock('latest');
    const blockTimestamp = block.timestamp;
    // Add 1 week to current block timestamp
    SEASON_END_TIME = blockTimestamp + 60 * 60 * 24 * 20;
  } else if (chainId == '31337') {
    TOTAL_STARDUST_PER_SECOND = ethers.utils.parseEther('0.5');
    // Get current block timestamp
    const block = await ethers.provider.getBlock('latest');
    const blockTimestamp = block.timestamp;
    SEASON_END_TIME = blockTimestamp + 60 * 60 * 24 * 7;
  } else {
  }

  let contract = await deploy('AtlantisRacing', {
    from: deployer,
    args: [registry.address, TOTAL_STARDUST_PER_SECOND, SEASON_END_TIME, argonautsMultiplier],
  });

  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getRacing');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setRacing', contract.address);
      console.log(`AtlantisRacing address changed from ${currentAddress} to ${contract.address}`);
    }
  }
};

//module.exports.dependencies = ['Phase1'];
module.exports.tags = ['Phase2', 'AtlantisRacing'];
