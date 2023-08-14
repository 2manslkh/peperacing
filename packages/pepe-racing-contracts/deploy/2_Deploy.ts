import 'dotenv/config';
import { ethers } from 'hardhat';
module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let pepeToken = await deployments.get('PEPERace');
  let tgPEPERace = await deploy('TelegramPEPERace', {
    from: deployer,
    contract: 'TelegramPEPERace',
    log: true,
    args: [pepeToken.address, 1000, 900, 100, deployer, 5, 30],
  });
  console.log('🚀 | module.exports= | TelegramPEPERace:', tgPEPERace.address);
  // Get PEPERace contract
  let pepeRace = await ethers.getContractAt('PEPERace', pepeToken.address);
  // Set TelegramPEPERace contract
  let tx = await pepeRace.setRacingContract(tgPEPERace.address);
};

module.exports.tags = ['Racing'];
