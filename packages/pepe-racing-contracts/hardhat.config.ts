import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import 'hardhat-deploy';
import 'dotenv/config';

import { ethers } from 'ethers';
import { task } from 'hardhat/config';

// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  let accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('new:wallet', 'Generate New Wallet', async (taskArgs, hre) => {
  const wallet = hre.ethers.Wallet.createRandom();
  console.log('PK: ', wallet.privateKey);
  console.log('Mnemonic: ', wallet.mnemonic?.phrase);
  console.log('Address: ', wallet.address);
});

let ACCOUNT;
let useMnemonic = true;

// Setup Default Values
let PRIVATE_KEY;
if (process.env.PRIVATE_KEY) {
  PRIVATE_KEY = process.env.PRIVATE_KEY;
} else {
  console.log('⚠️ Please set PRIVATE_KEY in the .env file');
  PRIVATE_KEY = ethers.Wallet.createRandom().privateKey;
}

let PRIVATE_KEY_TESTNET;
if (process.env.PRIVATE_KEY_TESTNET) {
  PRIVATE_KEY_TESTNET = process.env.PRIVATE_KEY_TESTNET;
} else {
  console.log('⚠️ Please set PRIVATE_KEY_TESTNET in the .env file');
  PRIVATE_KEY_TESTNET = ethers.Wallet.createRandom().privateKey;
}

if (!process.env.INFURA_API_KEY) {
  console.log('⚠️ Please set INFURA_API_KEY in the .env file');
}

if (!process.env.ETHERSCAN_API_KEY) {
  console.log('⚠️ Please set ETHERSCAN_API_KEY in the .env file');
}

if (useMnemonic) {
  let MNEMONIC;
  if (process.env.MNEMONIC) {
    MNEMONIC = process.env.MNEMONIC;
  } else {
    console.log('⚠️ Please set MNEMONIC in the .env file');
    MNEMONIC = 'test test test test test test test test test test test junk';
  }
  ACCOUNT = {
    mnemonic: MNEMONIC,
  };
} else {
  ACCOUNT = [PRIVATE_KEY];
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
      // accounts: ACCOUNT,
      // accounts: [PRIVATE_KEY],
    },
    hardhat: {
      // TODO: Add snapshot block
      // forking: {
      //   url: process.env.ALCHEMY_PROVIDER_MAINNET,
      //   block: 1789750,
      // },
      // blockGasLimit: 10000000000,
      // mining: {
      //   auto: true,
      // },
      // accounts: 'test test test test test test test test test test test junk',
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 1,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 4,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/ScRP1SpUCCa41B6Ef5m3dWmog0vcviZJ`,
      chainId: 5,
      accounts: [PRIVATE_KEY],
      saveDeployments: true,
    },
    matic: {
      url: 'https://polygon-rpc.com/',
      chainId: 137,
      accounts: ACCOUNT,
    },
    mumbai: {
      url: 'https://endpoints.omniatech.io/v1/matic/mumbai/public',
      chainId: 80001,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    optimism_mainnet: {
      url: 'https://mainnet.optimism.io',
      chainId: 10,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    optimism_testnet: {
      url: 'https://goerli.optimism.io',
      chainId: 420,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    arbitrum_mainnet: {
      url: 'https://arb1.arbitrum.io/rpc',
      chainId: 42161,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    arbitrum_testnet: {
      url: 'https://goerli-rollup.arbitrum.io/rpc',
      chainId: 421613,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    cronos_testnet: {
      url: `https://evm-t3.cronos.org`,
      chainId: 338,
      accounts: ACCOUNT,
    },
    cronos_mainnet: {
      url: `https://mainnet.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa/`,
      chainId: 25,
      accounts: ACCOUNT,
      gasLimit: 1000000000000,
    },
    scroll_testnet: {
      url: 'https://alpha-rpc.scroll.io/l2',
      chainId: 534353,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    metis_testnet: {
      url: 'https://goerli.gateway.metisdevops.link',
      chainId: 599,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    base_testnet: {
      url: 'https://goerli.base.org',
      chainId: 84531,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    mantle_testnet: {
      url: 'https://rpc.testnet.mantle.xyz',
      chainId: 5001,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    taiko_testnet: {
      url: 'https://rpc.test.taiko.xyz',
      chainId: 167005,
      accounts: ACCOUNT,
      saveDeployments: true,
      gasPrice: 5,
    },
    gnosis: {
      url: 'https://rpc.gnosischain.com/',
      chainId: 100,
      accounts: ACCOUNT,
      saveDeployments: true,
      gasPrice: 3000000000,
    },
    gnosis_testnet: {
      url: 'https://rpc.chiadochain.net',
      chainId: 10200,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    sepolia: {
      url: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
      chainId: 11155111,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
    thundercore_testnet: {
      url: 'https://testnet-rpc.thundercore.com',
      chainId: 18,
      accounts: ACCOUNT,
      saveDeployments: true,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
      {
        version: '0.8.11',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
      {
        version: '0.8.12',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
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
  etherscan: {
    apiKey: {
      taiko_testnet: '42069',
    },
    customChains: [
      {
        network: 'taiko_testnet',
        chainId: 167005,
        urls: {
          apiURL: 'https://explorer.test.taiko.xyz/api',
          browserURL: 'https://explorer.test.taiko.xyz',
        },
      },
    ],
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
