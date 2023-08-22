import 'dotenv/config';

import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';
import { ArgoPetz, MockERC721 } from '../typechain';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let argonauts = await deployments.get('MockERC721');
  let argoPetz = await deployments.get('ArgoPetz');
  console.log('argonauts.address', argonauts.address);
  console.log('argoPetz.address', argoPetz.address);
  // Chain Dependent Settings
  if (chainId == '25') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    argonauts = '0xa996aD2b9f240F78b063E47F552037658c4563d1';

    return;
  } else if (chainId == '338') {
    console.log('TESTNET DEPLOYMENT...');

    // Deploy ArgoQuest
    let argoQuest = await deploy('ArgoQuest', {
      from: deployer,
      log: true,
      args: [argonauts.address, argoPetz.address],
    });
  } else if (chainId == '31337') {
    return;
  } else {
    return;
  }
};

module.exports.tags = ['ArgoQuest'];
