import 'dotenv/config';
import { GasLogger } from '../utils/GasLogger';
import { ethers } from 'hardhat';
import { MockERC1155 } from '../typechain';

const gasLogger = new GasLogger();

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let mockErc1155 = await deployments.getOrNull('MockERC1155');

  // Chain Dependent Settings
  if (chainId == '25') {
    console.log('MAINNET DEPLOYMENT...(Skipping Mock)');
    // return;
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }
  let erc1155Burner = await deploy('ERC1155Burner', {
    from: deployer,
    log: true,
    args: ['0x0A37674F61a9345f32E277b15E3C9603cDe710f6'],
  });
};

module.exports.tags = ['Burner'];
