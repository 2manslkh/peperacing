import { ArgoPetz } from '../typechain';
import { ethers } from 'hardhat';

async function main() {
  // Get signer
  const signers = await ethers.getSigners();

  // Get ArgoPetz
  const argoPetz = (await ethers.getContractAt(
    'ArgoPetz',
    '0x56EC8c71B5D5D6F93d6B628b7FD706ef4da7C0dF',
    signers[0]
  )) as ArgoPetz;

  await argoPetz.setStage(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
