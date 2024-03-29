import 'dotenv/config';

import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';
import { ArgoPetz } from '../typechain';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let signerAddress = '0x6A952f966c5DcC36A094c8AB141f027fb58F864e';
  let incentiveAddress = '0x31ea6CF75114191C701A4fbf294b69f6f06e0A2b';
  //let royaltyAddress = '0x31ea6CF75114191C701A4fbf294b69f6f06e0A2b';
  let baseURI;
  // Chain Dependent Settings
  if (chainId == '25') {
    baseURI = 'ipfs://bafybeiftfn2trjds7ncovc7lieviekqdeb2ddhaevf3a22bgjz26pztvsy/';
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    let argoPetz = await deploy('ArgoPetz', {
      from: deployer,
      log: true,
      args: ['ArgoPetz', 'ARGOPETZ', baseURI, 8888, deployer, signerAddress, 50, incentiveAddress],
    });

    //await argoPetz.setDefaultRoyalty(royaltyAddress, 750);
    return;
  } else if (chainId == '338') {
    console.log('TESTNET DEPLOYMENT...');
    signerAddress = '0x6A952f966c5DcC36A094c8AB141f027fb58F864e';
    baseURI = 'ipfs://bafybeiftfn2trjds7ncovc7lieviekqdeb2ddhaevf3a22bgjz26pztvsy/';

    // Deploy MockArgoPetz
    let argoPetz = await deploy('ArgoPetz', {
      from: deployer,
      log: true,
      args: ['Mock Minion', 'Minion', baseURI, 8888, deployer, signerAddress, 50, incentiveAddress],
    });
  } else if (chainId == '31337') {
    signerAddress = '0x6A952f966c5DcC36A094c8AB141f027fb58F864e';
    baseURI = 'https://testnet-api.argopetz.com/api/v1/argopetz/';
    // Deploy MockArgoPetz
    let argoPetz = await deploy('ArgoPetz', {
      from: deployer,
      log: true,
      args: ['ArgoPetz', 'ARGOPETZ', baseURI, 8888, deployer, signerAddress, 50, incentiveAddress],
    });
  } else {
    return;
  }
};

module.exports.tags = ['ArgoPetz'];
