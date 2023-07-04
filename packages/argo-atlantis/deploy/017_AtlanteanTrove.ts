import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let controller = '0x2FB1C26ec1FBC25d65E415b8CD07e07d5d20dcFc';
  let signerAddress = '0x6a952f966c5dcc36a094c8ab141f027fb58f864e';
  // Chain Dependent Settings
  if (chainId == '25') {
    controller = '0x2FB1C26ec1FBC25d65E415b8CD07e07d5d20dcFc';
  } else if (chainId == '338') {
    controller = '0x2FB1C26ec1FBC25d65E415b8CD07e07d5d20dcFc';
  } else if (chainId == '31337') {
    controller = deployer;
    signerAddress = process.env.SIGNER_ADDRESS_TESTNET ?? '';
  } else {
    return;
  }

  let contract = await deploy('AtlanteanTrove', {
    from: deployer,
    log: true,
    args: [controller, signerAddress],
  });
};
module.exports.tags = ['AtlanteanTrove'];
