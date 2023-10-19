import { ethers, BigNumberish } from 'ethers';

require('dotenv').config();
const provider = new ethers.JsonRpcProvider("https://mainnet.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa/");
// const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const Sybil = require("../deployments/cronos_mainnet/Sybil.json");
const SybilABI = Sybil.abi;
const SybilAddress = Sybil.address;
async function main() {
    // Get controller wallet
  const controllerWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  // Get signer
  const signerWithProvider = controllerWallet.connect(provider);
    const sybil = new ethers.Contract(SybilAddress, SybilABI, signerWithProvider);
   const mnemonic = ethers.Mnemonic.fromPhrase(process.env.MNEMONIC);
   const masterNode = ethers.HDNodeWallet.fromMnemonic(mnemonic);
    const wallets: string[] = []
    const eth: BigNumberish[] = []
  for (let i = 0; i < 200; i++) {
   const derivedNode = masterNode.derivePath(`m/44'/60'/0'/0/${i}`);
    const wallet = new ethers.Wallet(derivedNode.privateKey);
    wallets.push(wallet.address);
    eth.push(ethers.parseEther('0.5'))
    
  }
  let tx = await sybil.airdropETH(wallets, eth, {value: ethers.parseEther('100')});
  console.log(tx.hash);
}

main().catch((error) => {
  console.error(`Error occurred: ${error.message}`);
});

