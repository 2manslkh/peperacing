import 'dotenv/config';

import { ethers } from 'ethers';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log('🚀 | module.exports= | deployer:', deployer);
  const chainId = await getChainId();
  let controller = '0x6DE01c3DB3AC8ceC90d7516ADE520e0F0Fdc6525';
  let pepeToken = await deploy('TestMeme', {
    from: deployer,
    contract: 'TestMeme',
    log: true,
    args: [],
  });
  let tgPEPERace = await deploy('TelegramPEPERace', {
    from: deployer,
    contract: 'TelegramPEPERace',
    log: true,
    args: [pepeToken.address, ethers.parseEther('0.2'), 3, 2, deployer, 5, 30, controller],
  });
  console.log('🚀 | module.exports= | TelegramPEPERace:', tgPEPERace.address);

  await execute('TestMeme', { from: deployer, log: true }, 'setRacingContract', tgPEPERace.address);
};

module.exports.tags = ['Racing'];
