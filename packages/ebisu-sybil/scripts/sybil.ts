import { ethers } from 'ethers';
import axios from 'axios';
const Sybil = require('../deployments/cronos_mainnet/Sybil.json');
const SybilABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_masterWallet',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_addresses',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '_amounts',
        type: 'uint256[]',
      },
    ],
    name: 'airdropETH',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256[]',
            name: 'ids',
            type: 'uint256[]',
          },
          {
            internalType: 'uint256[]',
            name: 'amounts',
            type: 'uint256[]',
          },
          {
            internalType: 'uint256',
            name: 'expire',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'nonce',
            type: 'uint256',
          },
        ],
        internalType: 'struct IResources.MintRequest[]',
        name: 'requests',
        type: 'tuple[]',
      },
      {
        internalType: 'bytes[]',
        name: 'signatures',
        type: 'bytes[]',
      },
    ],
    name: 'bulkMintWithSig',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct Sybil.BulkTransfer[]',
        name: 'transfers',
        type: 'tuple[]',
      },
    ],
    name: 'bulkSafeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'masterWallet',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
const SybilAddress = Sybil.address;
require('dotenv').config();

const BASE_URL = 'https://cms.ebisusbay.com/api/ryoshi-dynasties';
const provider = new ethers.JsonRpcProvider('https://mainnet.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa/');
// Localhost provider
//const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const NUM_WALLETS = process.env.NUM_WALLETS ? parseInt(process.env.NUM_WALLETS) : 400;
const NUM_SKIP = process.env.NUM_SKIP ? parseInt(process.env.NUM_SKIP) : 0;
const BATCH_SIZE = 20;
const maxRetries = 3; // Adjust as necessary

async function checkIn(address, signature) {
  const url = `${BASE_URL}/context/user?address=${address}&signature=${signature}`;
  return axios.get(url);
}

async function getDailyReward(address, signature) {
  const url = `${BASE_URL}/game-tokens/daily-reward/claim?address=${address}&signature=${signature}`;
  // Keep track of the retry attempts
  let attempt = 0;
  const maxAttempts = 10; // Set a max number of attempts if you want to limit retries
  let retryDelay = 30000; // Delay between retries, e.g., 30 seconds
  while (true) {
    try {
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        // Optionally cap the number of retries
        if (++attempt > maxAttempts) throw new Error('Max retry attempts reached.');

        console.log(
          `Not time yet to check in (403). Retrying attempt #${attempt} after ${retryDelay / 1000} seconds...`,
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // Uncomment the line below to implement exponential backoff
        retryDelay *= 2;
      } else if (axios.isAxiosError(error) && error.response?.status === 500) {
        // Optionally cap the number of retries
        if (++attempt > maxAttempts) throw new Error('Max retry attempts reached.');

        console.log(`Internal server error (500). Retrying attempt #${attempt} after ${retryDelay / 1000} seconds...`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // Uncomment the line below to implement exponential backoff
        retryDelay *= 2;
      } else {
        // For any other errors, log and rethrow
        console.error('Failed to retrieve daily reward:', error);
        throw error;
      }
    }
  }
}

async function signMessageForWallet(wallet) {
  const message =
    "Welcome to Ebisu's Bay!\n\nClick to sign in and accept the Ebisu's Bay Terms of Service: https://app.ebisusbay.com/terms-of-service.html\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\n" +
    'Wallet address:\n'.concat(wallet.address.toLowerCase());

  const signedMessage = await wallet.signMessage(message);

  return signedMessage;
}

async function main() {
  const mnemonic = ethers.Mnemonic.fromPhrase(process.env.MNEMONIC);
  const masterNode = ethers.HDNodeWallet.fromMnemonic(mnemonic);
  // Get controller wallet
  const controllerWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  // Get signer
  let signerWithProvider = controllerWallet.connect(provider);

  // Get Sybil contract
  const sybil = new ethers.Contract(SybilAddress, SybilABI, signerWithProvider);

  const requests = [];
  const signatures = [];
  for (let i = 0; i < NUM_WALLETS; i++) {
    if (i < NUM_SKIP) {
      continue;
    }
    if (i % 50 == 0 && i != 0) {
      // SLEEP 20 SECONDS
      console.log('Sleeping for 30 seconds...');
      await new Promise((r) => setTimeout(r, 30000));
    }
    const derivedNode = masterNode.derivePath(`m/44'/60'/0'/0/${i}`);
    const wallet = new ethers.Wallet(derivedNode.privateKey);

    const signedMessage = await signMessageForWallet(wallet);
    console.log(`Checking in for wallet ${i}`);
    await checkIn(wallet.address, signedMessage);

    console.log(`Getting daily reward for wallet ${i}`);
    let reward = await getDailyReward(wallet.address, signedMessage);
    // // If reward.nonce is undefined, try again
    // while (reward.nonce == undefined) {
    //   console.log(`Reward nonce is undefined for wallet ${i}. Trying again...`);
    //   // Wait for few seconds
    //   await new Promise((r) => setTimeout(r, 10000));
    //   reward = await getDailyReward(wallet.address, signedMessage);
    // }

    // Form MintRequest
    // const mintRequest = {
    //   to: wallet.address,
    //   ids: reward.tokenIds,
    //   amounts: reward.quantity,
    //   expire: reward.expiresAt,
    //   nonce: reward.nonce,
    // };
    // const signature = reward.signature;
    // requests.push(mintRequest);
    // signatures.push(signature);

    // if (requests.length == BATCH_SIZE) {
    //   let success = false;
    //   for (let attempt = 1; attempt <= maxRetries && !success; attempt++) {
    //     try {
    //       const bulkMintTx = await sybil.bulkMintWithSig(requests, signatures, { value: ethers.parseEther('0') });
    //       await bulkMintTx.wait();
    //       console.log(`Bulk Mint Transaction Hash: ${bulkMintTx.hash}`);

    //       requests.length = 0;
    //       signatures.length = 0;

    //       success = true;
    //     } catch (error) {
    //       console.error(`Attempt ${attempt} failed with error:`, error);
    //       // Log the contract sybil
    //       console.log('Requests: ', requests);
    //       console.log('Signatures: ', signatures);
    //       if (attempt < maxRetries) {
    //         console.log(`Retrying... (Attempt ${attempt + 1} of ${maxRetries})`);
    //       } else {
    //         console.error('All attempts failed. Please check the issue.');
    //       }
    //     }
    //   }
    // }
  }
  // // If requests array is not empty, call bulk mint
  // if (requests.length > 0) {
  //   const bulkMintTx = await sybil.bulkMintWithSig(requests, signatures, { value: ethers.parseEther('0') });
  //   await bulkMintTx.wait();
  //   console.log(`Bulk Mint Transaction Hash: ${bulkMintTx.hash}`);
  // }
}

main().catch((error) => {
  console.error(`Error occurred: ${error.message}`);
});
