import 'dotenv/config';
import { ethers } from 'hardhat';
module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  // let pepeToken = await deployments.get('PEPERace');
  let controller = '';
  let mockToken = await deploy('MockToken', {
    from: deployer,
    contract: 'MockToken',
    log: true,
    args: ['MockToken', 'MockToken', 18, ethers.utils.parseEther('1000000000')],
  });
  let tgPEPERace = await deploy('TelegramPEPERace', {
    from: deployer,
    contract: 'TelegramPEPERace',
    log: true,
    args: [mockToken.address, 1000, 900, 100, deployer, 5, 30, controller],
  });
  console.log('🚀 | module.exports= | TelegramPEPERace:', tgPEPERace.address);
  // Get PEPERace contract
  let pepeRace = await ethers.getContractAt('PEPERace', pepeToken.address);
  // Set TelegramPEPERace contract
  let tx = await pepeRace.setRacingContract(tgPEPERace.address);
};

module.exports.tags = ['Racing'];
