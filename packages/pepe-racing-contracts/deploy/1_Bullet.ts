import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let bulletGame = await deploy('BulletGame', {
    from: deployer,
    log: true,
    args: [],
  });

};

module.exports.tags = ['TestContract'];
