import { config, deployments, ethers, hardhatArguments } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  // Get contract
  let pepeToken = await ethers.getContractAt('PEPERace', '0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c');
  //await pepeToken.stealthLaunch({ value: ethers.parseEther('10') });
  await pepeToken.enableAntiBotMode();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
