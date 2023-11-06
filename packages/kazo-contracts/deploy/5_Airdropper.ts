import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('Airdropper', {
    from: deployer,
    log: true,
    args: [],
  });
};

module.exports.tags = ['Airdropper'];
