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

  // await argonauts.mint(20);
  // await argonauts.setApprovalForAll(getAddress('ArgoQuest'), true);
  // await argoPetz.setApprovalForAll(getAddress('ArgoQuest'), true);
  // await argoQuest.setArgopetz(getAddress('ArgoPetz'));
  //await argoQuest.setCanQuest(true);
  //await argoQuest.startQuest(20, [3759, 3383]);
  // // await argoPetz.setPublicMintPrice(ethers.utils.parseEther('0'));
  // await argoPetz.setStage(2);
  await argoPetz.publicMint(100);
  // // await argoPetz.setApprovalForAll(starmap.address, true);
  // await starmap.stakeNFT([1537, 2577, 3185]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
