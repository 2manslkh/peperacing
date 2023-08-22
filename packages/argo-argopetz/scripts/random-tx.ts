import { ArgoPetz, StarMapCrafting, ArgoQuest, MockERC721 } from '../typechain';
import { deployments, ethers } from 'hardhat';

export async function getContract(contractName: string) {
  return await ethers.getContractAt(contractName, (await deployments.get(contractName)).address);
}
export async function getAddress(contractName: string) {
  return (await deployments.get(contractName)).address;
}
async function main() {
  // Get signer
  const signers = await ethers.getSigners();
  const signer = signers[0];
  const argoPetz: ArgoPetz = (await getContract('ArgoPetz')) as ArgoPetz;
  const starmap: StarMapCrafting = (await getContract('StarMapCrafting')) as StarMapCrafting;
  const argoQuest: ArgoQuest = (await getContract('ArgoQuest')) as ArgoQuest;
  const argonauts: MockERC721 = (await getContract('MockERC721')) as MockERC721;
  let argoQuestAddr = await argoQuest.getAddress();
  //await argoPetz.setPublicMintPrice(ethers.parseEther('0'));
  // await argoPetz.publicMint(10, { value: ethers.parseEther('0') });
  //await argoQuest.setCanQuest(true);
  // await argonauts.setApprovalForAll(argoQuestAddr, true);
  // await argoPetz.setApprovalForAll(argoQuestAddr, true);
  await argoQuest.startQuest(1, [2954, 3657, 4589, 5069]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
