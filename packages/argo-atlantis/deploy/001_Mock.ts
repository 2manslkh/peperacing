import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');

  // Chain Dependent Settings
  if (chainId == '25') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    // return;
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }
  let mockArgonauts = await deploy('MockArgonauts', {
    from: deployer,
    log: true,
    args: [registry.address],
  });

  let mockERC1155 = await deploy('MockERC1155', {
    from: deployer,
    log: true,

    args: [],
  });

  let mockXARGO = await deploy('XARGO', {
    from: deployer,
    log: true,
    args: [],
  });

  let mockWCRO = await deploy('MockWCRO', {
    from: deployer,
    log: true,
    args: [],
  });

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getArgonauts');
    if (currentAddress !== mockArgonauts.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setArgonauts', mockArgonauts.address);
      console.log(`Argonauts address changed from ${currentAddress} to ${mockArgonauts.address}`);
    }

    currentAddress = await read('AtlantisAddressRegistry', 'getXargo');
    console.log('currentAddress', currentAddress);
    if (currentAddress !== mockXARGO.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setXargo', mockXARGO.address);
      console.log(`XARGO address changed from ${currentAddress} to ${mockXARGO.address}`);
    }
  }
};

module.exports.dependencies = ['AtlantisAddressRegistry'];
module.exports.tags = ['Mock'];
