import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let contract = await deploy('Multicall3', {
    from: deployer,
    args: [],
  });

  console.log('Multicall3 deployed at: ', contract.address);
};

module.exports.tags = ['Multicall'];
