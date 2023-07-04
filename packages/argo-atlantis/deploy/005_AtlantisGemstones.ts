import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { GasLogger } from '../utils/GasLogger';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');

  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
  }

  // Get old gemstone contract
  // let oldGemstone = await deployments.getOrNull('AtlantisGemstones');
  // // Get old gemstone addr
  // let oldGemstoneAddr = oldGemstone.address;

  let contract = await deploy('AtlantisGemstones', {
    from: deployer,
    log: true,
    args: [
      'Atlantis Gemstones',
      'GEMSTONES',
      'ipfs://QmaHbdibWgKYRToaseoJXpEgG9gUk1pHJh3WwrAp3XsVvd/',
      deployer,
      registry.address,
    ],
  });

  // Set on Registry Contract
  if (registry) {
    console.log('Setting AtlantisGemstones on AtlantisAddressRegistry');
    let currentAddress = await read('AtlantisAddressRegistry', 'getGemstones');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setGemstones', contract.address);
      console.log(`AtlantisGemstones address changed from ${currentAddress} to ${contract.address}`);
    }
  }
  /*
  enum TokenApprovalStatus {
    NOT_APPROVED,
    ERC_721_APPROVED,
    ERC_1155_APPROVED,
  }
  */
  // Set old Gemstone contract on marketplace contract as not approved
  // console.log('Unsetting:', contract.name, contract.address);
  // await execute(
  //   'AtlantisMarketplace',
  //   { from: deployer, log: true },
  //   'setTokenApprovalStatus',
  //   oldGemstoneAddr,
  //   0,
  //   gold.address
  // );

  // // Set new Gemstone contract on marketplace contract as ERC_721_APPROVED
  // console.log('Setting:', contract.name, contract.address);
  // await execute(
  //   'AtlantisMarketplace',
  //   { from: deployer, log: true },
  //   'setTokenApprovalStatus',
  //   contract.address,
  //   2,
  //   gold.address
  // );
};

module.exports.tags = ['AtlantisGemstones', 'Phase1'];
