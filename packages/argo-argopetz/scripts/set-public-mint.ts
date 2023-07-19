import { ArgoPetz } from '../typechain';
import { ethers } from 'hardhat';

async function main() {
  // Get signer
  const signers = await ethers.getSigners();

  // Get ArgoPetz
  const argoPetz = (await ethers.getContractAt(
    'ArgoPetz',
    '0xc0958bDE2Ef9Ac061788036D55f31E18eE6B1270',
    signers[0]
  )) as ArgoPetz;

  // await argoPetz.setStage(2);
  // await argoPetz.setPublicMintPrice(ethers.parseEther('0'));
  await argoPetz.publicMint(300, { value: ethers.parseEther('0') });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
