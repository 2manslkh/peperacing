import { ArgoPetz } from '../typechain';
import { ethers } from 'hardhat';

async function main() {
  // Get signer
  const signers = await ethers.getSigners();

  // Get ArgoPetz
  // const argoPetz = (await ethers.getContractAt(
  //   'ArgoPetz',
  //   '0xc607A5633d96F924B12cC91b721b2487fe806f03',
  //   signers[0]
  // )) as ArgoPetz;

  const argoPetz = (await ethers.getContractAt(
    'ArgoPetz',
    '0xd32C596994A07946699cAea4e669C6e284A85958',
    signers[0]
  )) as ArgoPetz;
  // await argoPetz.setDefaultRoyalty('0xA5bE31EAA5d862048fd34F61e46Fcb32221B275E', 750);

  await argoPetz.reveal('ipfs://bafybeihweuwkqg4ns5bdjvn6lw6tythnjx5phoqhcxmhz44c3rzs445uji/');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
