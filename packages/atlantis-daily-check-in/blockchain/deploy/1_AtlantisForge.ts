import 'dotenv/config';
import { ethers } from 'ethers';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let signerAddress = process.env.SIGNER_ADDRESS;
  // Get forge token deployment
  const forge = await deployments.get('ForgeToken');
  // Actual addresses
  const gemstonesAddress = '0xcbB22330413bE9C5dE7d80BBA4B14CE99d9F3aBa';
  const equipmentAddress = '0xfa6888F9f3602E02507a2Bbed661c8cb256949c8';
  const forgeAddress = forge.address;
  let atlantisForge;
  // Chain Dependent Settings
  if (chainId == '25') {
    atlantisForge = await deploy('AtlantisForge', {
      from: deployer,
      args: [forgeAddress, gemstonesAddress, equipmentAddress, ethers.parseEther('10'), ethers.parseEther('1')],
      log: true,
    });
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
    atlantisForge = await deploy('AtlantisForge', {
      from: deployer,
      args: [forgeAddress, gemstonesAddress, equipmentAddress, ethers.parseEther('10'), ethers.parseEther('1')],
      log: true,
    });
  } else {
    return;
  }
};

module.exports.tags = ['AtlantisForge'];
