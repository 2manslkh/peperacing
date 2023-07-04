import 'dotenv/config';
import { Gold, Stardust } from '../typechain';
import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  // Get gold and stardust contracts
  const gold = (await ethers.getContract('Gold', deployer)) as Gold;
  const stardust = (await ethers.getContract('Stardust', deployer)) as Stardust;
  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }

  // Get current block
  const block = await ethers.provider.getBlockNumber();
  // startBlock will be 30 blocks from now
  const startBlock = 8822680;
  // EndBlock will be 30 days from now. If 1 block is 3 seconds, then 1 day is 28800 blocks
  const endBlock = 9716473;

  // Initialise rewardPerBlock to 1
  const rewardPerBlock = ethers.utils.parseEther('0.5');
  let contract = await deploy('GoldPledging', {
    from: deployer,
    log: true,
    args: [gold.address, stardust.address, rewardPerBlock, startBlock, endBlock],
  });
};

module.exports.tags = ['GoldPledging'];
