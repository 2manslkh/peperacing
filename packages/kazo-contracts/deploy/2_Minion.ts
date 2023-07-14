import 'dotenv/config';

import { ethers } from 'hardhat';
import { Leader } from '../typechain';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let signerAddress;
  let baseURI;
  // Chain Dependent Settings
  if (chainId == '1') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    signerAddress = '0xBDfAAD57daecf05786a5Fca0dB9BB0c7Ea2c04E0';
    return;
  } else if (chainId == '5001') {
    console.log('TESTNET DEPLOYMENT...');
    signerAddress = '0xBDfAAD57daecf05786a5Fca0dB9BB0c7Ea2c04E0';
    baseURI = 'backendAPI';

    // Deploy Minion
    let minion = await deploy('Minion', {
      from: deployer,
      log: true,
      args: [
        'Mock Minion',
        'Minion',
        baseURI,
        1000,
        deployer,
        signerAddress,
        10000,
        20,
        ethers.parseEther('0.01'),
        ethers.parseEther('0.02'),
      ],
    });
  } else if (chainId == '31337') {
    signerAddress = '0xBDfAAD57daecf05786a5Fca0dB9BB0c7Ea2c04E0';
  } else {
    return;
  }
};

module.exports.tags = ['Minion'];
