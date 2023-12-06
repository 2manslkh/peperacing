import 'dotenv/config';

import { ethers } from 'ethers';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let signerAddress = process.env.SIGNER_ADDRESS;
  let forge;
  // Chain Dependent Settings
  if (chainId == '25') {
    forge = await deploy('ForgeToken', {
      from: deployer,
      args: [signerAddress],
      log: true,
    });
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
    forge = await deploy('ForgeToken', {
      from: deployer,
      args: [signerAddress],
      log: true,
    });
  } else {
    return;
  }
};

module.exports.tags = ['Sybil'];
