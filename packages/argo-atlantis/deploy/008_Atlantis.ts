import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { ethers } from 'hardhat';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');
  let treasury = '0x493a152A821c6418b62A46bEda4de941b128A4Ac';
  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }

  let contract = await deploy('Atlantis', {
    from: deployer,
    log: true,
    args: [registry.address, treasury],
  });

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getAtlantis');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setAtlantis', contract.address);
      console.log(`Atlantis address changed from ${currentAddress} to ${contract.address}`);
    }
  }

  // Create an array with levels from 1-50
  let levelArray = Array.from({ length: 50 }, (v, k) => k + 1);
  // Create an array where the first 9 is 10, then next 10 is 20, then next 10 is 30, then next 10 is 40, then last 11 is 50
  let materialArray = Array.from({ length: 50 }, (v, k) => {
    if (k < 9) {
      return 12;
    } else if (k < 19) {
      return 24;
    } else if (k < 29) {
      return 36;
    } else if (k < 39) {
      return 48;
    } else if (k < 49) {
      return 60;
    } else {
      return 72;
    }
  });

  // Get atlantis contract
  const Atlantis = await ethers.getContractFactory('Atlantis');

  // Attach
  const AtlantisContract = Atlantis.attach(contract.address);
  // Set material rate for atlantis
  //await AtlantisContract.setGemstoneRate(levelArray, materialArray);
  //await AtlantisContract.setNftGemstoneMultiplier([10, 12, 14, 16]);
  await AtlantisContract.setRarityMultiplier([10, 12, 14, 16]);
};

module.exports.tags = ['Phase1', 'Atlantis'];
