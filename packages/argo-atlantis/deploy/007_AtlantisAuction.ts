import 'dotenv/config';

import { AtlantisAddressRegistry } from '../typechain';
import { ethers } from 'hardhat';

module.exports = async ({ getNamedAccounts, deployments, getChainId }: any) => {
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  let registry: AtlantisAddressRegistry = await deployments.getOrNull('AtlantisAddressRegistry');

  let TIME_BUFFER: any;
  let RESERVE_PRICE: any;
  let MIN_BID_INCREMENT_PERCENTAGE: any;
  let MIN_STACKED_BID_INCREMENT: any;
  let START_TIME: any;
  let END_TIME: any;

  // Chain Dependent Settings
  if (chainId == '25') {
    console.log('Cronos Mainnet');
    TIME_BUFFER = 300; // Time in seconds between 2 bids for a single user
    RESERVE_PRICE = ethers.parseEther('1000'); // Minimum Bid in CRO
    MIN_BID_INCREMENT_PERCENTAGE = 10; // Minimum Increment Percentage from LOWEST BIDDER (10 = 10% increment from lowest bid)
    MIN_STACKED_BID_INCREMENT = ethers.parseEther('50'); // Minimum Bid Increment in CRO
    START_TIME = Math.floor(Date.now() / 1000);
    START_TIME = START_TIME + 3600;
    END_TIME = START_TIME + 7200;
    START_TIME = 1682517600;
    END_TIME = 1682604000;
  } else if (chainId == '338') {
    TIME_BUFFER = 300; // Time in seconds between 2 bids for a single user
    RESERVE_PRICE = ethers.parseEther('1000'); // Minimum Bid in CRO
    MIN_BID_INCREMENT_PERCENTAGE = 10; // Minimum Increment Percentage from LOWEST BIDDER (10 = 10% increment from lowest bid)
    MIN_STACKED_BID_INCREMENT = ethers.parseEther('50'); // Minimum Bid Increment in CRO
    START_TIME = Math.floor(Date.now() / 1000);
    START_TIME = START_TIME + 3600;
    END_TIME = START_TIME + 7200; // End Time in Unix Timestamp of the auction (END_TIME != 0) (24hrs after start time)
  } else if (chainId == '31337') {
    TIME_BUFFER = 60; // Time in seconds between 2 bids for a single user
    RESERVE_PRICE = ethers.parseEther('1000'); // Minimum Bid in CRO
    MIN_BID_INCREMENT_PERCENTAGE = 10; // Minimum Increment Percentage from LOWEST BIDDER (10 = 10% increment from lowest bid)
    MIN_STACKED_BID_INCREMENT = ethers.parseEther('50'); // Minimum Bid Increment in CRO
    START_TIME = Math.floor(Date.now() / 1000 - 50000);
    START_TIME = START_TIME + 1800;
    END_TIME = START_TIME + 10800; // End Time in Unix Timestamp of the auction (END_TIME != 0) (72hrs after start time)
  } else {
    console.log('Unknown chainId: ', chainId);
    return;
  }

  /**
  * Params
    AtlantisPlanets _st,
    uint256 _timeBuffer,
    uint256 _reservePrice,
    uint8 _minBidIncrementPercentage,
    uint256 _minStackedBidIncrement,
    uint256 _startTime,
    uint256 _endTime
  */
  let contract = await deploy('AtlantisAuction', {
    from: deployer,
    log: true,
    args: [
      registry.address,
      TIME_BUFFER,
      RESERVE_PRICE,
      MIN_BID_INCREMENT_PERCENTAGE,
      MIN_STACKED_BID_INCREMENT,
      START_TIME,
      END_TIME,
    ],
  });

  // Set on Registry Contract
  if (registry) {
    let currentAddress = await read('AtlantisAddressRegistry', 'getAuction');
    if (currentAddress !== contract.address) {
      await execute('AtlantisAddressRegistry', { from: deployer, log: true }, 'setAuction', contract.address);
      console.log(`AtlantisAuction address changed from ${currentAddress} to ${contract.address}`);
    }
  }
};
//module.exports.dependencies = ['AtlantisPlanets'];
module.exports.tags = ['Phase1', 'AtlantisAuction'];
