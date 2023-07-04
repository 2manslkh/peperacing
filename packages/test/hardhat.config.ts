import "@nomicfoundation/hardhat-toolbox";

import { HardhatUserConfig } from "hardhat/config";
import { task } from 'hardhat/config';

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {

  let accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.18",
};

export default config;
