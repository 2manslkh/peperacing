import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deploy('Bank', {
    from: deployer,
    log: true,
    args: [],
  });
  await deploy('Gold', {
    from: deployer,
    log: true,
    args: [],
  });
  await deploy('Diamonds', {
    from: deployer,
    log: true,
    args: [],
  });


};

module.exports.tags = ['TestContract'];
