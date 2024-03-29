import { ethers } from 'ethers';
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

const provider = new ethers.JsonRpcProvider('https://mainnet.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa/');
// Localhost provider
const NUM_WALLETS = process.env.NUM_WALLETS ? parseInt(process.env.NUM_WALLETS) : 400;
const NUM_SKIP = process.env.NUM_SKIP ? parseInt(process.env.NUM_SKIP) : 0;
const ERC1155ABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'previousAdmin', type: 'address' },
      { indexed: false, internalType: 'address', name: 'newAdmin', type: 'address' },
    ],
    name: 'AdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'beacon', type: 'address' }],
    name: 'BeaconUpgraded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint8', name: 'version', type: 'uint8' }],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
          { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
          { internalType: 'uint256', name: 'expire', type: 'uint256' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
        ],
        indexed: false,
        internalType: 'struct Resources.MintRequest',
        name: 'request',
        type: 'tuple',
      },
    ],
    name: 'MintRequestByAdmin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'bytes32', name: 'digest', type: 'bytes32' }],
    name: 'MintRequestCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'bytes32', name: 'digest', type: 'bytes32' }],
    name: 'MintRequestSuccess',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'previousAdminRole', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'newAdminRole', type: 'bytes32' },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { indexed: false, internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    ],
    name: 'TransferBatch',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'TransferSingle',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'value', type: 'string' },
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'URI',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'implementation', type: 'address' }],
    name: 'Upgraded',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address[]', name: 'accounts', type: 'address[]' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    ],
    name: 'burnBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'domainSeparator',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'exists',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
          { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
          { internalType: 'uint256', name: 'expire', type: 'uint256' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
        ],
        internalType: 'struct Resources.MintRequest',
        name: 'mintRequest',
        type: 'tuple',
      },
    ],
    name: 'hashMintRequest',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'initialize', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
          { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
          { internalType: 'uint256', name: 'expire', type: 'uint256' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
        ],
        internalType: 'struct Resources.MintRequest',
        name: 'request',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'invalidateRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
          { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
          { internalType: 'uint256', name: 'expire', type: 'uint256' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
        ],
        internalType: 'struct Resources.MintRequest',
        name: 'request',
        type: 'tuple',
      },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
          { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
          { internalType: 'uint256', name: 'expire', type: 'uint256' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
        ],
        internalType: 'struct Resources.MintRequest',
        name: 'request',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'mintWithSig',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'role', type: 'bytes32' },
      { internalType: 'address', name: 'account', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_tokenId', type: 'uint256' },
      { internalType: 'uint256', name: '_salePrice', type: 'uint256' },
    ],
    name: 'royaltyInfo',
    outputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeBatchTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'uint96', name: 'feeNumerator', type: 'uint96' },
    ],
    name: 'setDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'uint96', name: 'feeNumerator', type: 'uint96' },
    ],
    name: 'setTokenRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_tokenId', type: 'uint256' },
      { internalType: 'string', name: '_uri', type: 'string' },
    ],
    name: 'setUri',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newImplementation', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
];

interface Transfer {
  from: string;
  to: string;
  id: number;
  amount: number;
  data: string;
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

  // Get ERC1155 contract
  let erc1155 = new ethers.Contract('0xce3f4e59834b5B52B301E075C5B3D427B6884b3d', ERC1155ABI, signerWithProvider);
  // Aggregate all ERC1155 tokens to aggregated wallet

  const aggregatedWallet = '0x81A8403887CeB1f6b6AA8A2C14eDE31DB0D8744D';

  const bulkTrf: Transfer[] = [];
  // Aggregate all ERC1155 tokens to aggregated wallet
  let total: BigInt = BigInt(0);
  for (let i = 0; i < 1001; i++) {
    if (i < NUM_SKIP) {
      continue;
    }
    const derivedNode = masterNode.derivePath(`m/44'/60'/0'/0/${i}`);
    const wallet = new ethers.Wallet(derivedNode.privateKey);
    signerWithProvider = wallet.connect(provider);
    erc1155 = new ethers.Contract('0xce3f4e59834b5B52B301E075C5B3D427B6884b3d', ERC1155ABI, signerWithProvider);

    const balance = await erc1155.balanceOf(wallet.address, 1);
    if (balance == 0) {
      continue;
    }
    // Log wallet and balance
    console.log(`Wallet ${i} has balance ${balance}`);
    let transfer = {
      from: wallet.address,
      to: aggregatedWallet,
      id: 1,
      amount: balance,
      data: '0x00',
    };
    total += balance;

    bulkTrf.push(transfer);

    // Approve ERC1155 contract to spend tokens
    // If ERC1155 allowance is
    if ((await erc1155.isApprovedForAll(wallet.address, SybilAddress)) == false) {
      // console log wallet address and tx hash
      console.log('Wallet address: ', wallet.address);
      let tx = await erc1155.setApprovalForAll(SybilAddress, true);
      console.log(`Set approval for wallet ${i} Transaction Hash: ${tx.hash}`);
    }
  }
  console.log(`Total balance: ${total}`);
  //Call bulk safe transfer
  let tx = await sybil.bulkSafeTransferFrom(bulkTrf);
  console.log(`Bulk transfer Transaction Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(`Error occurred: ${error.message}`);
});
