import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  // Chain Dependent Settings
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
    return;
  }

  let mockLeader = await deploy('MockERC721', {
    from: deployer,
    log: true,
    args: ['Mock Leader', 'LEADER'],
  });
};
module.exports.tags = ['Mock'];
