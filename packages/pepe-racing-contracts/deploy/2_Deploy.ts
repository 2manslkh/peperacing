import 'dotenv/config';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();


  let tgRussianRoulette = await deploy('TelegramRussianRoulette', {
    from: deployer,
    contract: 'TelegramRussianRoulette',
    log: true,
    args: ["0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c", 1000, 900, 100, deployer],
  });
  console.log("🚀 | module.exports= | tgRussianRoulette:", tgRussianRoulette.address)

};

module.exports.tags = ['TestContract'];
