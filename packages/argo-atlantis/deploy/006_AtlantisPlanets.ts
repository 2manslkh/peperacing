import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer, signer } = await getNamedAccounts();
  const chainId = await getChainId();
  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');

  let OWNER: string = '';
  let WHITELIST_SIGNER_ADDRESS: string = '';
  let REVEALED_IPFS_HASH: string = '';
  let REGISTRY_ADDRESS: string = '';
  // let oldPlanets = await deployments.getOrNull('AtlantisPlanets');
  // let oldPlanetsAddr = oldPlanets.address;
  let WETH;

  // Chain Dependent Settings
  let contract;
  if (chainId === '25') {
    OWNER = deployer;
    WHITELIST_SIGNER_ADDRESS = process.env.SIGNER_ADDRESS_TESTNET ? process.env.SIGNER_ADDRESS_TESTNET : '';
    REVEALED_IPFS_HASH = '';
    REGISTRY_ADDRESS = registry.address;
  } else if (chainId === '338') {
    OWNER = deployer;
    WHITELIST_SIGNER_ADDRESS = process.env.SIGNER_ADDRESS_TESTNET ? process.env.SIGNER_ADDRESS_TESTNET : '';
    REVEALED_IPFS_HASH = 'ipfs://bafybeifrdwqiiptmgfkmlbotmm352d5fw5acqpfvyqrnot3ceboevbddgq/';
    REGISTRY_ADDRESS = registry.address;

    contract = await deploy('MockAtlantisPlanets', {
      from: deployer,
      log: true,
      args: [OWNER, WHITELIST_SIGNER_ADDRESS, REVEALED_IPFS_HASH, REGISTRY_ADDRESS],
    });
  } else if (chainId === '31337') {
    OWNER = deployer;
    WHITELIST_SIGNER_ADDRESS = process.env.SIGNER_ADDRESS_TESTNET ? process.env.SIGNER_ADDRESS_TESTNET : '';
    REVEALED_IPFS_HASH = 'ipfs://bafybeifrdwqiiptmgfkmlbotmm352d5fw5acqpfvyqrnot3ceboevbddgq/';
    REGISTRY_ADDRESS = registry.address;
    WETH = '0xcdFC872c4404389e88d0C02e1788ecC7fa5A88A1';
    contract = await deploy('MockAtlantisPlanets', {
      from: deployer,
      log: true,
      args: [OWNER, WHITELIST_SIGNER_ADDRESS, REVEALED_IPFS_HASH, REGISTRY_ADDRESS],
    });
  } else {
    return;
  }

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getAtlantisPlanets');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setAtlantisPlanets', contract.address);
      console.log(`AtlantisPlanets address changed from ${currentAddress} to ${contract.address}`);
    }
  }

  /*
  enum TokenApprovalStatus {
    NOT_APPROVED,
    ERC_721_APPROVED,
    ERC_1155_APPROVED,
  }
  */
  // Set old Spaceships contract on marketplace contract as not approved
  // console.log('Unsetting:', contract.name, contract.address);
  // await execute(
  //   'AtlantisMarketplace',
  //   { from: deployer, log: true },
  //   'setTokenApprovalStatus',
  //   oldPlanetsAddr,
  //   0,
  //   WETH
  // );

  // // Set new Spaceships contract on marketplace contract as ERC_721_APPROVED
  // console.log('Setting:', contract.name, contract.address);
  // await execute(
  //   'AtlantisMarketplace',
  //   { from: deployer, log: true },
  //   'setTokenApprovalStatus',
  //   contract.address,
  //   1,
  //   WETH
  // );
};
module.exports.tags = ['Phase1', 'AtlantisPlanets'];
