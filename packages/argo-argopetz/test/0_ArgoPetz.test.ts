import { expect } from 'chai';
const { ethers, deployments } = require('hardhat');
import { ArgoPetz } from '../typechain';
// Dotenv config
require('dotenv').config();

type SignatureResult = {
  signature: string;
  nonce: string;
};

async function getSignature(user: string, whitelistPhase: number): Promise<SignatureResult> {
  const wallet = new ethers.Wallet(process.env.SIGNER_PK_TESTNET!);
  const nonce = ethers.randomBytes(32);

  const msgHash = ethers.solidityPacked(['address', 'bytes', 'uint8'], [user, nonce, whitelistPhase]);
  const signature = await wallet.signMessage(ethers.getBytes(msgHash));
  return { signature, nonce: ethers.hexlify(nonce) };
}
describe('ArgoPetz', () => {
  let argoPetz: ArgoPetz;
  let owner: any;
  let user1: any;
  let user2: any;
  let users: any;

  before(async () => {
    // Get signers
    users = await ethers.getSigners();
    [owner, user1, user2] = users;
    // Get deployments
    await deployments.fixture(['ArgoPetz']);
    // Get contract
    argoPetz = (await ethers.getContract('ArgoPetz')) as ArgoPetz;
  });
  // it('Should mint tokens in whitelist stage', async () => {
  //   // Set stage to whitelist
  //   await argoPetz.setStage(1);

  //   // Set whitelist mint price
  //   await argoPetz.setWhitelistMintPrice(ethers.parseEther('449'));

  //   // Get signature and nonce
  //   const { signature, nonce } = await getSignature(user2.address, 1);
  //   console.log('Signature:', signature);
  //   console.log('Nonce:', nonce);

  //   // Mint tokens for user2
  //   await argoPetz.connect(user2).whitelistMint(1, nonce, signature, { value: ethers.parseEther('449') });

  //   // Check if token was minted
  //   expect(await argoPetz.totalSupply()).to.equal(2);
  // });

  it('Should mint tokens in public stage', async () => {
    // Set stage to public
    await argoPetz.setStage(2);

    // Set public mint price
    await argoPetz.setPublicMintPrice(ethers.parseEther('499'));

    // Mint tokens for user1
    await argoPetz.connect(user1).publicMint(1, { value: ethers.parseEther('499') });

    let tx = await argoPetz.tokenURI(1);
    console.log(tx);
    tx = await argoPetz.tokenURI(2);
    console.log(tx);
    await argoPetz.reveal('ipfs://bafybeidxkwzu3c4jyrzo44fkg6qjytccnl4vnvhixepcmpkuj6rjvizauu/');
    tx = await argoPetz.tokenURI(1);
    console.log(tx);
    tx = await argoPetz.tokenURI(2);
    console.log(tx);

    // Check if token was minted
    expect(await argoPetz.totalSupply()).to.equal(1);
  });
});
