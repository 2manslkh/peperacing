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
  const nonce = ethers.utils.randomBytes(32);
  const msgHash = ethers.utils.solidityKeccak256(['address', 'bytes', 'uint8'], [user, nonce, whitelistPhase]);
  const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));
  return { signature, nonce: ethers.utils.hexlify(nonce) };
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

    // Deploy ArgoPetz contract
    const ArgoPetzFactory = await ethers.getContractFactory('ArgoPetz', owner);
    argoPetz = await ArgoPetzFactory.deploy(
      'ArgoPetz',
      'PETZ',
      'https://api.argopetz.com/',
      20,
      owner.address,
      '0x6A952f966c5DcC36A094c8AB141f027fb58F864e'
    );
  });

  it('Should mint tokens in whitelist stage', async () => {
    // Set stage to whitelist
    await argoPetz.setStage(1);

    // Set whitelist mint price
    await argoPetz.setWhitelistMintPrice(ethers.utils.parseEther('0.2'));

    // Get signature and nonce
    const { signature, nonce } = await getSignature(user2.address, 2);

    // Mint tokens for user2
    await argoPetz.connect(user2).whitelistMint(1, nonce, signature, { value: ethers.utils.parseEther('0.2') });

    // Check if token was minted
    expect(await argoPetz.totalSupply()).to.equal(2);
  });

  it('Should mint tokens in public stage', async () => {
    // Set stage to public
    await argoPetz.setStage(3);

    // Set public mint price
    await argoPetz.setPublicMintPrice(ethers.utils.parseEther('0.3'));

    // Mint tokens for user1
    await argoPetz.connect(user1).publicMint(1, { value: ethers.utils.parseEther('0.3') });

    // Check if token was minted
    expect(await argoPetz.totalSupply()).to.equal(3);
  });

  it('Should set and get token URI', async () => {
    // Mint out token
    await argoPetz.connect(user1).publicMint(17, { value: ethers.utils.parseEther('5.1') });
    // Get token URI
    const tokenURI = await argoPetz.tokenURI(1);

    // Check if token URI is correct
    expect(tokenURI).to.equal('https://api.argopetz.com/1');
  });

  // Add more test cases for other functions and edge cases
});
