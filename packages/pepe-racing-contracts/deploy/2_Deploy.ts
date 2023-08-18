import 'dotenv/config';

import { ethers, parseEther } from 'ethers';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer, user_1, user_2 } = await getNamedAccounts();
  console.log("🚀 | module.exports= | user_2:", user_2)
  console.log("🚀 | module.exports= | user_1:", user_1)
  console.log('🚀 | module.exports= | deployer:', deployer);
  const chainId = await getChainId();
  // let pepeToken = await deployments.get('PEPERace');
  let controller = '0x6DE01c3DB3AC8ceC90d7516ADE520e0F0Fdc6525';
  let mockToken = await deploy('MockERC20', {
    from: deployer,
    contract: 'MockERC20',
    log: true,
    args: ['MockToken', 'MockToken', 18, ethers.parseEther('1000000000')],
  });
  let tgPEPERace = await deploy('TelegramPEPERace', {
    from: deployer,
    contract: 'TelegramPEPERace',
    log: true,
    args: [mockToken.address, 1000, 5, deployer, 5, 30, controller], //TODO: @0xKratos Fix this
  });
  console.log('🚀 | module.exports= | TelegramPEPERace:', tgPEPERace.address);
  // Get PEPERace contract
  // let pepeRace = await deployments.get('PEPERace');
  // Set TelegramPEPERace contract

  // TODO: @0xKratos Fix this
  // await execute(
  //   'PEPERace',
  //   { from: deployer, log: true },
  //   'setRacingContract',
  //   tgPEPERace.address
  // );

  await execute(
    'MockERC20',
    { from: deployer, log: true },
    'mint',
    user_1, parseEther('1000000000')
  );

  await execute(
    'MockERC20',
    { from: deployer, log: true },
    'mint',
    user_2, parseEther('1000000000')
  );

  await execute(
    'MockERC20',
    { from: user_1, log: true },
    'approve',
    tgPEPERace.address, parseEther('1000000000')
  );

  await execute(
    'MockERC20',
    { from: user_2, log: true },
    'approve',
    tgPEPERace.address, parseEther('1000000000')
  );
};

module.exports.tags = ['Racing'];
