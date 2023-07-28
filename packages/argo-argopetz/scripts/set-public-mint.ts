import { ArgoPetz } from '../typechain';
import { ethers } from 'hardhat';

async function main() {
  // Get signer
  const signers = await ethers.getSigners();

  // Get ArgoPetz
  const argoPetz = (await ethers.getContractAt(
    'ArgoPetz',
    '0xcd50c5bAAA765A0c761DDd58D6e1aB95fA76eA7C',
    signers[0]
  )) as ArgoPetz;

  // await argoPetz.setStage(1);
  //await argoPetz.setPublicMintPrice(ethers.parseEther('2'));
  //  await argoPetz.publicMint(300, { value: ethers.parseEther('0') });
  //await argoPetz.setWhitelistMintPrice(ethers.parseEther('1'));
  // await argoPetz.setWit
  // let signerAddr = await argoPetz.WHITELIST_SIGNER_ADDRESS();
  // console.log(signerAddr);
  // await argoPetz.whitelistMint(
  //   49,
  //   '0xa51ad89398fbd236a9ff9a7d71e893e6ca2b5fc854b462b10ee9a4aca1d94af0',
  //   '0x874cf51ec7b79aa9972cae052441de79c7c47767d9a94a5a49b8637283f938fe369f61d71266ef1366be896aff45f6889bda9743685017444ab34e7a8eb208f91b',
  //   { value: ethers.parseEther('0') }
  // );
  // await argoPetz.setPublicMintPrice(ethers.parseEther('0'));
  // await argoPetz.publicMint(300, { value: ethers.parseEther('0') });
  // let tx = await argoPetz.tokenURI(8505);
  // console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
