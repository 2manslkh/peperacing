import { DeployFunction } from 'hardhat-deploy/types';
import { Gold } from '../typechain';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId, ethers } = hre;
  const { deploy, execute, read } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let gold: Gold; // gold as payment token
  const fee = 1000; // 10% NOTE: DEFAULT FEES
  const feeWithCollectionOwner = 250; // 2.5% NOTE: PROTOCOL FEES WHEN THERE IS A COLLECTION OWNER
  const feeRecipient = '0x7AbE95E802885e51464ceF43Cc5367528bbD2029'; // L1 Atlantis Treasury Multisig
  const newOwner = deployer;
  const newProxyOwner = deployer;
  let WETH; // L1 WETH address

  let ARGONAUTS_ADDRESS,
    ATLANTIS_PLANETS_ADDRESS,
    ATLANTIS_MATERIALS_ADDRESS,
    ATLANTIS_EQUIPMENTS_ADDRESS,
    ATLANTIS_SPACESHIPS_ADDRESS;

  // Chain Dependent Settings
  if (chainId == '25') {
    ARGONAUTS_ADDRESS = '0xa996aD2b9f240F78b063E47F552037658c4563d1';
    ATLANTIS_PLANETS_ADDRESS = (await deployments.get('AtlantisPlanets')).address;
    ATLANTIS_MATERIALS_ADDRESS = (await deployments.get('AtlantisGemstones')).address;
    ATLANTIS_EQUIPMENTS_ADDRESS = (await deployments.get('AtlantisEquipments')).address;
    ATLANTIS_SPACESHIPS_ADDRESS = (await deployments.get('AtlantisSpaceships')).address;
    gold = await ethers.getContractAt('Gold', (await deployments.get('Gold'))) as Gold;
    WETH = '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23';
  } else if (chainId == '338') {
    console.log('Testnet');
    ARGONAUTS_ADDRESS = (await deployments.get('MockArgonauts')).address;
    ATLANTIS_PLANETS_ADDRESS = (await deployments.get('MockAtlantisPlanets')).address;
    ATLANTIS_MATERIALS_ADDRESS = (await deployments.get('AtlantisGemstones')).address;
    ATLANTIS_EQUIPMENTS_ADDRESS = (await deployments.get('AtlantisEquipments')).address;
    ATLANTIS_SPACESHIPS_ADDRESS = (await deployments.get('AtlantisSpaceships')).address;
    gold = await ethers.getContractAt('Gold', (await deployments.get('Gold'))) as Gold;
    WETH = '0x6904D2084BE89c7DFE93d9Ba3f63fDB77AaFb77A';
    // Console log all these addresses
    console.log('ARGONAUTS_ADDRESS: ', ARGONAUTS_ADDRESS);
    console.log('ATLANTIS_PLANETS_ADDRESS: ', ATLANTIS_PLANETS_ADDRESS);
    console.log('ATLANTIS_MATERIALS_ADDRESS: ', ATLANTIS_MATERIALS_ADDRESS);
    console.log('ATLANTIS_EQUIPMENTS_ADDRESS: ', ATLANTIS_EQUIPMENTS_ADDRESS);
    console.log('ATLANTIS_SPACESHIPS_ADDRESS: ', ATLANTIS_SPACESHIPS_ADDRESS);
    console.log('gold: ', gold.address);
  } else if (chainId == '31337') {
    ARGONAUTS_ADDRESS = (await deployments.get('MockArgonauts')).address;
    ATLANTIS_PLANETS_ADDRESS = (await deployments.get('AtlantisPlanets')).address;
    ATLANTIS_MATERIALS_ADDRESS = (await deployments.get('AtlantisGemstones')).address;
    ATLANTIS_EQUIPMENTS_ADDRESS = (await deployments.get('AtlantisEquipments')).address;
    ATLANTIS_SPACESHIPS_ADDRESS = (await deployments.get('AtlantisSpaceships')).address;
    gold = await ethers.getContractAt('Gold', (await deployments.get('Gold'))) as Gold;
    WETH = (await deployments.get('MockWCRO')).address;
  } else {
    return;
  }

  // Argonauts: $CRO;
  // Planets: $CRO;
  // Equipment: $GOLD;
  // Gemstones: $GOLD;
  // Spaceships: $CRO;

  /**
    0-NOT_APPROVED
    1-ERC_721_APPROVED
    2-ERC_1155_APPROVED
   */
  const nftApprovedList: {
    name: string;
    address: string;
    status: number;
    paymentToken: string;
  }[] = [
      {
        name: 'Argonauts',
        address: ARGONAUTS_ADDRESS ? ARGONAUTS_ADDRESS : '',
        status: 1,
        paymentToken: WETH,
      },
      {
        name: 'AtlantisPlanets',
        address: ATLANTIS_PLANETS_ADDRESS,
        status: 1,
        paymentToken: WETH,
      },
      {
        name: 'AtlantisGemstones',
        address: ATLANTIS_MATERIALS_ADDRESS,
        status: 2,
        paymentToken: gold.address,
      },
      {
        name: 'AtlantisEquipments',
        address: ATLANTIS_EQUIPMENTS_ADDRESS,
        status: 2,
        paymentToken: gold.address,
      },
      {
        name: 'AtlantisSpaceships',
        address: ATLANTIS_SPACESHIPS_ADDRESS,
        status: 1,
        paymentToken: WETH,
      },
    ];

  const atlantisMarketplace = await deploy('AtlantisMarketplace', {
    from: deployer,
    log: true,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [fee, feeRecipient, gold.address],
        },
      },
    },
  });

  const wethFromContract = await read('AtlantisMarketplace', 'weth');
  if (WETH !== wethFromContract) {
    await execute('AtlantisMarketplace', { from: deployer, log: true }, 'setWeth', WETH);
  }

  for (const nft of nftApprovedList) {
    if ((await read('AtlantisMarketplace', 'tokenApprovals', nft.address)) == 0) {
      console.log('setting:', nft.name, nft.address);
      console.log('Payment token: ', nft.paymentToken);
      await execute(
        'AtlantisMarketplace',
        { from: deployer, log: true },
        'setTokenApprovalStatus',
        nft.address,
        nft.status,
        nft.paymentToken
      );
    }
  }

  if (!(await read('AtlantisMarketplace', 'areBidsActive'))) {
    await execute('AtlantisMarketplace', { from: deployer, log: true }, 'toggleAreBidsActive');
  }

  const ATLANTIS_MARKETPLACE_ADMIN_ROLE = await read('AtlantisMarketplace', 'ATLANTIS_MARKETPLACE_ADMIN_ROLE');

  if (!(await read('AtlantisMarketplace', 'hasRole', ATLANTIS_MARKETPLACE_ADMIN_ROLE, newOwner))) {
    await execute(
      'AtlantisMarketplace',
      { from: deployer, log: true },
      'grantRole',
      ATLANTIS_MARKETPLACE_ADMIN_ROLE,
      newOwner
    );
  }

  // if new owner is set, remove original owner
  if (
    (await read('AtlantisMarketplace', 'hasRole', ATLANTIS_MARKETPLACE_ADMIN_ROLE, deployer)) &&
    newOwner != deployer
  ) {
    await execute(
      'AtlantisMarketplace',
      { from: deployer, log: true },
      'renounceRole',
      ATLANTIS_MARKETPLACE_ADMIN_ROLE,
      deployer
    );
  }

  const feeFromContract = await read('AtlantisMarketplace', 'fee');
  const feeWithCollectionOwnerFromContrat = await read('AtlantisMarketplace', 'feeWithCollectionOwner');
  if (feeFromContract.toNumber() != fee || feeWithCollectionOwnerFromContrat.toNumber() != feeWithCollectionOwner) {
    await execute('AtlantisMarketplace', { from: deployer, log: true }, 'setFee', fee, feeWithCollectionOwner);
  }

  const DefaultProxyAdmin = await deployments.get('DefaultProxyAdmin');

  const entries = [
    { name: 'DefaultProxyAdmin.address', value: DefaultProxyAdmin.address },
    {
      name: 'DefaultProxyAdmin.getProxyAdmin("AtlantisMarketplace")',
      value: await read('DefaultProxyAdmin', 'getProxyAdmin', atlantisMarketplace.address),
    },
    { name: 'DefaultProxyAdmin.owner()', value: await read('DefaultProxyAdmin', 'owner') },
    {
      name: `AtlantisMarketplace.hasRole(${newOwner})`,
      value: await read('AtlantisMarketplace', 'hasRole', ATLANTIS_MARKETPLACE_ADMIN_ROLE, newOwner),
    },
    {
      name: `AtlantisMarketplace.hasRole(${deployer})`,
      value: await read('AtlantisMarketplace', 'hasRole', ATLANTIS_MARKETPLACE_ADMIN_ROLE, deployer),
    },
    { name: `AtlantisMarketplace.feeReceipient()`, value: await read('AtlantisMarketplace', 'feeReceipient') },
    { name: `AtlantisMarketplace.fee()`, value: (await read('AtlantisMarketplace', 'fee')).toNumber() },
  ];

  console.log(`---- AtlantisMarketplace Config ----`);
  console.table(entries);
};
export default func;
func.tags = ['Phase2', 'Marketplace'];
