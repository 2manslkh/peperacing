import { ArgoPetz } from '../typechain';
import { ethers } from 'hardhat';

async function main() {
  // Get signer
  const signers = await ethers.getSigners();

  // Get ArgoPetz
  const argoPetz = (await ethers.getContractAt(
    'ArgoPetz',
    '0x6303FC2e1e3c8ceEE3098486D22F16d8f57f592e',
    signers[0]
  )) as ArgoPetz;

  // await argoPetz.setStage(2);
  // await argoPetz.setPublicMintPrice(ethers.parseEther('0'));
  //await argoPetz.publicMint(100, { value: ethers.parseEther('0') });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
