import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let game = await deploy('PEPERace', {
    from: deployer,
    log: true,
    args: [deployer, deployer, deployer],
  });
};

module.exports.tags = ['PEPERace'];
