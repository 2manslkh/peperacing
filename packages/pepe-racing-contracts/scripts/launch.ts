import { config, deployments, ethers, hardhatArguments } from 'hardhat';
import { TestMeme } from '../typechain/TestMeme';
async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  // TODO: NOT TESTED YET
  // Get deployments
  const { deploy } = deployments;
  let bettingToken: TestMeme = await deployments.get('TestMeme');
  // Get contract bettingToken
  bettingToken = await ethers.getContractAt('TestMeme', bettingToken.address);
  await bettingToken.addLiquidity({ value: ethers.parseEther('2') });
  await bettingToken.enableTrading();
  await bettingToken.removeLimits();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
