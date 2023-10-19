import { ethers } from 'ethers';
import axios from 'axios';
const Sybil = require("../deployments/cronos_mainnet/Sybil.json");
const SybilABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_masterWallet",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_addresses",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "_amounts",
          "type": "uint256[]"
        }
      ],
      "name": "airdropETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256[]",
              "name": "ids",
              "type": "uint256[]"
            },
            {
              "internalType": "uint256[]",
              "name": "amounts",
              "type": "uint256[]"
            },
            {
              "internalType": "uint256",
              "name": "expire",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "nonce",
              "type": "uint256"
            }
          ],
          "internalType": "struct IResources.MintRequest[]",
          "name": "requests",
          "type": "tuple[]"
        },
        {
          "internalType": "bytes[]",
          "name": "signatures",
          "type": "bytes[]"
        }
      ],
      "name": "bulkMintWithSig",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
            }
          ],
          "internalType": "struct Sybil.BulkTransfer[]",
          "name": "transfers",
          "type": "tuple[]"
        }
      ],
      "name": "bulkSafeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "masterWallet",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
const SybilAddress = Sybil.address;
require('dotenv').config();

const BASE_URL = 'https://cms.ebisusbay.com/api/ryoshi-dynasties';
const provider = new ethers.JsonRpcProvider("https://cronos.w3node.com/89a2b64ccd1e8cbaebd3fde0b8954df5a8e6043fb5617686c0528db368739ecf/api");
// Localhost provider
//const provider = new ethers.JsonRpcProvider("http://localhost:8545");
const NUM_WALLETS = 200;
const NUM_SKIP = 180;
const maxRetries = 3; // Adjust as necessary
const ERC1155ABI= [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint256","name":"expire","type":"uint256"},{"internalType":"uint256","name":"nonce","type":"uint256"}],"indexed":false,"internalType":"struct Resources.MintRequest","name":"request","type":"tuple"}],"name":"MintRequestByAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"digest","type":"bytes32"}],"name":"MintRequestCancelled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"digest","type":"bytes32"}],"name":"MintRequestSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"indexed":false,"internalType":"uint256[]","name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"TransferSingle","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"value","type":"string"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"URI","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"accounts","type":"address[]"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"}],"name":"balanceOfBatch","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"values","type":"uint256[]"}],"name":"burnBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"domainSeparator","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"exists","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint256","name":"expire","type":"uint256"},{"internalType":"uint256","name":"nonce","type":"uint256"}],"internalType":"struct Resources.MintRequest","name":"mintRequest","type":"tuple"}],"name":"hashMintRequest","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint256","name":"expire","type":"uint256"},{"internalType":"uint256","name":"nonce","type":"uint256"}],"internalType":"struct Resources.MintRequest","name":"request","type":"tuple"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"invalidateRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint256","name":"expire","type":"uint256"},{"internalType":"uint256","name":"nonce","type":"uint256"}],"internalType":"struct Resources.MintRequest","name":"request","type":"tuple"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint256","name":"expire","type":"uint256"},{"internalType":"uint256","name":"nonce","type":"uint256"}],"internalType":"struct Resources.MintRequest","name":"request","type":"tuple"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"mintWithSig","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"proxiableUUID","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"_salePrice","type":"uint256"}],"name":"royaltyInfo","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeBatchTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint96","name":"feeNumerator","type":"uint96"}],"name":"setDefaultRoyalty","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint96","name":"feeNumerator","type":"uint96"}],"name":"setTokenRoyalty","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"string","name":"_uri","type":"string"}],"name":"setUri","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"uri","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]

interface Transfer {
    from: string;
    to: string;
    id: number;
    amount: number;
    data: string;
}

async function checkIn(address, signature) {
  const url = `${BASE_URL}/context/user?address=${address}&signature=${signature}`;
  return axios.get(url);
}

async function getDailyReward(address, signature) {
  const url = `${BASE_URL}/game-tokens/daily-reward?address=${address}&signature=${signature}`;
  const response = await axios.get(url);
  return response.data.data;
}

async function signMessageForWallet(wallet) {

  const message = "Welcome to Ebisu's Bay!\n\nClick to sign in and accept the Ebisu's Bay Terms of Service: https://app.ebisusbay.com/terms-of-service.html\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\n" + "Wallet address:\n".concat(wallet.address.toLowerCase())

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
   if(i < NUM_SKIP) {
      continue;
    }
    if ((i % 50 == 0) && (i != 0)) {
      // SLEEP 20 SECONDS
      console.log('Sleeping for 30 seconds...');
      await new Promise(r => setTimeout(r, 30000));
    }
  const derivedNode = masterNode.derivePath(`m/44'/60'/0'/0/${i}`);
  const wallet = new ethers.Wallet(derivedNode.privateKey);

  const signedMessage = await signMessageForWallet(wallet);
  console.log(`Checking in for wallet ${i}`)
  await checkIn(wallet.address, signedMessage);
  
  console.log(`Getting daily reward for wallet ${i}`)
  let reward = await getDailyReward(wallet.address, signedMessage);
    // If reward.nonce is undefined, try again
    while (reward.nonce == undefined) {
      console.log(`Reward nonce is undefined for wallet ${i}. Trying again...`)
      // Wait for few seconds
      await new Promise(r => setTimeout(r, 10000));
       reward = await getDailyReward(wallet.address, signedMessage);
    }


  // Form MintRequest
    const mintRequest = {
      to: wallet.address,
      ids: reward.tokenIds,
      amounts: reward.quantity,
      expire: reward.expiresAt,
      nonce: reward.nonce,
    };
    const signature = reward.signature;
    requests.push(mintRequest);
    signatures.push(signature);

    if (requests.length == 50) {

    let success = false;
    for (let attempt = 1; attempt <= maxRetries && !success; attempt++) {
        try {
            const bulkMintTx = await sybil.bulkMintWithSig(requests, signatures, { value: ethers.parseEther("0") });
            await bulkMintTx.wait();
            console.log(`Bulk Mint Transaction Hash: ${bulkMintTx.hash}`);

            requests.length = 0;
            signatures.length = 0;

            success = true;
        } catch (error) {
            console.error(`Attempt ${attempt} failed with error:`, error);
            // Log the contract sybil
            console.log("Requests: ", requests);
            console.log("Signatures: ", signatures)
            if (attempt < maxRetries) {
                console.log(`Retrying... (Attempt ${attempt + 1} of ${maxRetries})`);
            } else {
                console.error("All attempts failed. Please check the issue.");
            }
        }
    }
}

 }
  // If requests array is not empty, call bulk mint
  if (requests.length > 0) {
    const bulkMintTx = await sybil.bulkMintWithSig(requests, signatures, {value: ethers.parseEther("0")});
    await bulkMintTx.wait();
    console.log(`Bulk Mint Transaction Hash: ${bulkMintTx.hash}`);
  }

  // Aggregate all ERC1155 tokens to aggregated wallet

 const aggregatedWallet = "0x81A8403887CeB1f6b6AA8A2C14eDE31DB0D8744D";

// const bulkMintTx = await sybil.bulkMintWithSig(requests, signatures, {value: ethers.parseEther("0")});
// await bulkMintTx.wait();
// console.log(`Bulk Mint Transaction Hash: ${bulkMintTx.hash}`);
let erc1155 = new ethers.Contract("0xce3f4e59834b5B52B301E075C5B3D427B6884b3d", ERC1155ABI, signerWithProvider);
const bulkTrf : Transfer[] = []; 
// Aggregate all ERC1155 tokens to aggregated wallet
for (let i = 0; i < NUM_WALLETS; i++) {
  // if(i < NUM_SKIP) {
  //     continue;
  //   }
  const derivedNode = masterNode.derivePath(`m/44'/60'/0'/0/${i}`);
  const wallet = new ethers.Wallet(derivedNode.privateKey);
  const balance = await erc1155.balanceOf(wallet.address, 1);

  let transfer = {
    from: wallet.address,
    to: aggregatedWallet,
    id: 1,
    amount: balance,
    data: "0x00"
  }
  signerWithProvider = wallet.connect(provider);
  erc1155 = new ethers.Contract("0xce3f4e59834b5B52B301E075C5B3D427B6884b3d", ERC1155ABI, signerWithProvider);

  // let tx = await erc1155.setApprovalForAll(SybilAddress, true);
  // await tx.wait();
  // console.log(`Transaction Hash for approval: ${tx.hash}`)
  
  bulkTrf.push(transfer);

  }

  // Call bulk safe transfer 
let tx = await sybil.bulkSafeTransferFrom(bulkTrf);
console.log(`Bulk transfer Transaction Hash: ${tx.hash}`);

}

main().catch((error) => {
  console.error(`Error occurred: ${error.message}`);
});

