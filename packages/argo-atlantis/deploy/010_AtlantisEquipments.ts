import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { GasLogger } from '../utils/GasLogger';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer, treasury } = await getNamedAccounts();
  const chainId = await getChainId();

  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }
  // let gold: Gold;
  // gold = await deployments.get('Gold');
  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');

  // let stardustCosts = [
  //   ethers.utils.parseEther('25000'),
  //   ethers.utils.parseEther('36000'),
  //   ethers.utils.parseEther('49000'),
  //   ethers.utils.parseEther('64000'),
  //   ethers.utils.parseEther('81000'),
  // ];

  // Initialise empty Stardust Costs all 0
  let stardustCosts = [0, 0, 0, 0, 0];

  // let gemstonesRequired = [9, 13, 19, 27, 40];
  let gemstonesRequired = [1, 3, 5, 7, 9];
  let equipmentSpeeds = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  let contract = await deploy('AtlantisEquipments', {
    from: deployer,
    args: [
      'Atlantis Equipment',
      'EQUIPMENT',
      'ipfs://QmP1FtEm24phvvFxFVmwJcbwcBzeU9kQCKcfB1aV1kCBqd/',
      deployer,
      registry.address,
      '0x493a152A821c6418b62A46bEda4de941b128A4Ac',
      stardustCosts,
      gemstonesRequired,
      equipmentSpeeds,
    ],
  });
  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getEquipments');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setEquipments', contract.address);
      console.log(`AtlantisEquipments address changed from ${currentAddress} to ${contract.address}`);
    }
  }
  /*
  enum TokenApprovalStatus {
    NOT_APPROVED,
    ERC_721_APPROVED,
    ERC_1155_APPROVED,
  }
  */
  // Set old Equipment contract on marketplace contract as not approved
  // console.log('Unsetting:', contract.name, contract.address);
  // await execute(
  //   'AtlantisMarketplace',
  //   { from: deployer, log: true },
  //   'setTokenApprovalStatus',
  //   oldEquipmentAddr,
  //   0,
  //   gold.address
  // );

  // // Set new Equipment contract on marketplace contract as ERC_721_APPROVED
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
//module.exports.dependencies = ['Phase1'];
module.exports.tags = ['Phase2', 'AtlantisEquipments'];
