import 'dotenv/config';

import { ethers } from 'ethers';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const aggregateWallet = "0x81A8403887CeB1f6b6AA8A2C14eDE31DB0D8744D";
  let resources = "0xce3f4e59834b5B52B301E075C5B3D427B6884b3d";
  let masterWallet='0x68f213c0f471d4b5b579dd15bd9f2e15da792bbc'

  // Chain Dependent Settings
  if (chainId == '25') {
    let sybil = await deploy('Sybil', {
      from: deployer,
      args: [masterWallet],
      log: true,
    });
  } else if (chainId == '338') {

  } else if (chainId == '31337') {
      let sybil = await deploy('Sybil', {
      from: deployer,
      args: [masterWallet],
      log: true,
    });
  } else {
    return;
  }
};

module.exports.tags = ['Sybil'];
