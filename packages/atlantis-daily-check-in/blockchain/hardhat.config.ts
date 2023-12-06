import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import 'dotenv/config';
import '@nomiclabs/hardhat-ethers';
import { task } from 'hardhat/config';

let ethers = require('ethers');
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('new:wallet', 'Generate New Wallet', async (taskArgs, hre) => {
  const wallet = ethers.Wallet.createRandom();
  console.log('PK: ', wallet._signingKey().privateKey);
  console.log('Address: ', wallet.address);
});

// Setup Default Values
let PRIVATE_KEY;
if (process.env.PRIVATE_KEY) {
  PRIVATE_KEY = process.env.PRIVATE_KEY;
} else {
  console.log('⚠️ Please set PRIVATE_KEY in the .env file');
  PRIVATE_KEY = ethers.Wallet.createRandom()._signingKey().privateKey;
}

let PRIVATE_KEY_TESTNET;
if (process.env.PRIVATE_KEY_TESTNET) {
  PRIVATE_KEY_TESTNET = process.env.PRIVATE_KEY_TESTNET;
} else {
  console.log('⚠️ Please set PRIVATE_KEY_TESTNET in the .env file');
  PRIVATE_KEY_TESTNET = ethers.Wallet.createRandom()._signingKey().privateKey;
}

if (!process.env.ETHERSCAN_API_KEY) {
  console.log('⚠️ Please set ETHERSCAN_API_KEY in the .env file');
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://0.0.0.0:8545',
      saveDeployments: true,
      // accounts: [PRIVATE_KEY],
    },
    hardhat: {
      blockGasLimit: 40000000,
      mining: {
        auto: true,
      },
    },
    cronos_testnet: {
      url: `https://testnet-cronos.w3node.com/0aa9d84a638f2e0baa627443619cd2cb0ef65f5257170c7c8e9ebe39f427366b/api`,
      chainId: 338,
      accounts: [PRIVATE_KEY_TESTNET],
    },
    cronos_mainnet: {
      url: `https://mainnet.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa/`,
      chainId: 25,
      accounts: [PRIVATE_KEY],
      gasLimit: 1000000000000,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.23',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    treasury: {
      default: 1, // here this will by default take the second account as treasury
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    deploy: './deploy',
  },
  mocha: {
    timeout: 2000000000,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v6',
  },
  gasReporter: {
    enabled: true,
    gasPrice: 100,
  },
};
