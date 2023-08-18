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
  // Get an account from a private key
  let account = new ethers.Wallet(
    '0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82',
    ethers.getDefaultProvider('http://localhost:8545')
  );
  await bettingToken.connect(account).connectAndApprove(BigInt(123));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
