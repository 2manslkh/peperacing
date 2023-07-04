import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { Gold } from '../typechain';
import { GasLogger } from '../utils/GasLogger';
import { MockWCRO } from './../typechain/contracts/common/MockWCRO';
import { ethers } from 'hardhat';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');
  let gold: Gold = await deployments.getOrNull('Gold');
  // Chain Dependent Settings
  let contract = await deploy('AtlantisFaucet', {
    from: deployer,
    logs: true,
    args: [registry.address],
  });

  // if (chainId == '338') {
  //   console.log('Incentivised testnet, executing transfer ownership to faucet');
  //   gold.transferOwnership(contract.address);
  // }
  // Set on Registry Contract
  // if (registry) {
  //   let currentAddress = await read('AtlantisAddressRegistry', 'getFaucet');
  //   if (currentAddress !== contract.address) {
  //     await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setFaucet', contract.address);
  //     console.log(`Faucet address changed from ${currentAddress} to ${contract.address}`);
  //   }
  // }
};

module.exports.tags = ['AtlantisFaucet'];
