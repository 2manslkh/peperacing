import { deployments, ethers } from 'hardhat';

export async function getContract(contractName: string) {
  return await ethers.getContractAt(contractName, (await deployments.get(contractName)).address);
}
