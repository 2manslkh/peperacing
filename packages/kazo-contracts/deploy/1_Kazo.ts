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
    baseURI = 'ipfs://bafybeihoqbdoajoihcglk6ydim7bfemkcvo33dnfuobxyjhskiu6gq5fja/';
    name = 'KAZO';
    symbol = 'KAZO';
    maxSupply = 5000;
    withdrawAddress = deployer;
    incentiveAddress = '0xf075A4Aa7C2Be9b2d601F9F93a5c71AE88b3A86a';
    whitelistMaxMint = 5;
    feeNumerator = 500;
    whitelistMintPrice = ethers.parseEther('0.008');
    publicMintPrice = ethers.parseEther('0.01');
  } else if (chainId == '84531') {
    console.log('TESTNET DEPLOYMENT...');
    signerAddress = '0xBDfAAD57daecf05786a5Fca0dB9BB0c7Ea2c04E0';
    baseURI = 'ipfs://bafybeihoqbdoajoihcglk6ydim7bfemkcvo33dnfuobxyjhskiu6gq5fja/';
    name = 'KAZO';
    symbol = 'KAZO';
    maxSupply = 5000;
    withdrawAddress = deployer;
    incentiveAddress = '0x81A8403887CeB1f6b6AA8A2C14eDE31DB0D8744D';
    whitelistMaxMint = 5;
    feeNumerator = 500;
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
    gasLimit: 9000000,
  });
};

module.exports.tags = ['Kazo'];
