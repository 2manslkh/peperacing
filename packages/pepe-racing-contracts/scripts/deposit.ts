import { config, deployments, ethers, hardhatArguments } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();

  const testcontract = await deployments.get('TestContract');

  const contract = await deployments.getAt('TestContract', testcontract.address, deployer);

  const deposit = await contract.deposit({ value: ethers.parseEther('1') });
  console.log("🚀 | main | deposit:", deposit)

  let tx = await deposit.wait();
  console.log("🚀 | main | tx:", tx)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
