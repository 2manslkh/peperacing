import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let game = await deploy('TestMeme', {
    from: deployer,
    log: true,
    args: [],
  });
};

module.exports.tags = ['PEPESRace'];
