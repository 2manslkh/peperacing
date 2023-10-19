import 'dotenv/config';

import { ethers } from 'hardhat';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let name;
  let symbol;
  let baseURI;
  let maxSupply;
  let withdrawAddress;
  let signerAddress;
  let incentiveAddress;
  let whitelistMaxMint;
  let whitelistMintPrice;
  let publicMintPrice;
  let feeNumerator;
  // Chain Dependent Settings
  if (chainId == '8453') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    signerAddress = '0xBDfAAD57daecf05786a5Fca0dB9BB0c7Ea2c04E0';
    return;
  } else if (chainId == '84531') {
    console.log('TESTNET DEPLOYMENT...');
    signerAddress = '0xBDfAAD57daecf05786a5Fca0dB9BB0c7Ea2c04E0';
    baseURI = 'ipfs://';
    name = 'Mock Leader';
    symbol = 'MOCK';
    maxSupply = 5000;
    withdrawAddress = deployer;
    incentiveAddress = deployer;
    whitelistMaxMint = 5;
    feeNumerator = 100;
    whitelistMintPrice = ethers.parseEther('0.008');
    publicMintPrice = ethers.parseEther('0.01');
  } else if (chainId == '31337') {
    signerAddress = '0xBDfAAD57daecf05786a5Fca0dB9BB0c7Ea2c04E0';
  } else {
    return;
  }

  // Deploy Kazo
  let kazo = await deploy('Kazo', {
    from: deployer,
    log: true,
    args: [
      name,
      symbol,
      baseURI,
      maxSupply,
      withdrawAddress,
      signerAddress,
      incentiveAddress,
      whitelistMaxMint,
      whitelistMintPrice,
      publicMintPrice,
      feeNumerator,
    ],
  });
};

module.exports.tags = ['Kazo'];
