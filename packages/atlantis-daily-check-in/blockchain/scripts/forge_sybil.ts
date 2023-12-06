import { ethers } from 'ethers';
import axios from 'axios';

require('dotenv').config();

const provider = new ethers.JsonRpcProvider('https://mainnet.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa/');
// Localhost provider
//const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const NUM_WALLETS = process.env.NUM_WALLETS ? parseInt(process.env.NUM_WALLETS) : 400;
const NUM_SKIP = process.env.NUM_SKIP ? parseInt(process.env.NUM_SKIP) : 0;
const BATCH_SIZE = 20;
const maxRetries = 3; // Adjust as necessary
const ArgonautABI = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_approved',
        type: 'address',
      },
      {
        name: '_tokenId',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_from',
        type: 'address',
      },
      {
        name: '_to',
        type: 'address',
      },
      {
        name: '_tokenId',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

async function main() {
  const mnemonic = ethers.Mnemonic.fromPhrase(process.env.MNEMONIC);
  const masterNode = ethers.HDNodeWallet.fromMnemonic(mnemonic, 'm');
  // Get controller wallet
  const controllerWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  // Get signer
  let signerWithProvider = controllerWallet.connect(provider);

  // Get Sybil contract
  // const sybil = new ethers.Contract(SybilAddress, SybilABI, signerWithProvider);
  const argonauts = new ethers.Contract('0xa996aD2b9f240F78b063E47F552037658c4563d1', ArgonautABI, signerWithProvider);
  let totalArgonauts: BigInt = 0n;
  for (let i = 0; i < NUM_WALLETS; i++) {
    if (i < NUM_SKIP) {
      continue;
    }

    const path = ethers.getIndexedAccountPath(i);
    const derivedNode = masterNode.derivePath(path);
    const wallet = new ethers.Wallet(derivedNode.privateKey);
    // Check argonaut balance
    const balance = await argonauts.balanceOf(wallet.address);
    // Log address
    console.log(`Wallet ${i}: ${wallet.address}`);
    console.log(`Balance for wallet ${i}: ${balance}`);
    // Add balance to total argonauts
    totalArgonauts += balance;
  }
  // Console log total argonauts
  console.log(`Total argonauts: ${totalArgonauts}`);
}

main().catch((error) => {
  console.error(`Error occurred: ${error.message}`);
});
