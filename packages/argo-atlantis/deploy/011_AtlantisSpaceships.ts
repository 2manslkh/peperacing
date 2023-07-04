import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let WETH;
  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');
  let SIGNER_ADDRESS;
  // Chain Dependent Settings
  if (chainId == '25') {
    WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  } else if (chainId == '338') {
    WETH = '0xcdFC872c4404389e88d0C02e1788ecC7fa5A88A1';
  } else if (chainId == '31337') {
    SIGNER_ADDRESS = process.env.SIGNER_ADDRESS_TESTNET;
    //  return;
  } else {
    return;
  }

  // let oldSpaceships = await deployments.getOrNull('AtlantisSpaceships');
  // let oldSpaceshipsAddr = oldSpaceships.address;
  let contract = await deploy('AtlantisSpaceships', {
    from: deployer,
    args: [deployer, 'ipfs://bafybeifjxfjxjenulf3hnp3ghrbq54po42c7plkm3aw2wkpayz26eogfca/', registry.address],
  });

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getSpaceships');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setSpaceships', contract.address);
      console.log(`AtlantisSpaceships address changed from ${currentAddress} to ${contract.address}`);
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
  //   oldSpaceshipsAddr,
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

// module.exports.dependencies = ['Phase1'];
module.exports.tags = ['Phase2', 'AtlantisSpaceships'];
