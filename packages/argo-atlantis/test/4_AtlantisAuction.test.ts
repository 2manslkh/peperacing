import 'dotenv/config';

import { AtlantisAuction, AtlantisAuctionInterface } from './../typechain/contracts/AtlantisAuction';
import { BigNumber, Wallet } from 'ethers';

import { AtlantisPlanets } from '../typechain/contracts/AtlantisPlanets';
import { MockArgonauts } from '../typechain/contracts/common/MockArgonauts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/src/signers';
import { expect } from 'chai';

const { ethers, deployments } = require('hardhat');

let owner: SignerWithAddress;
let signers: SignerWithAddress[];

let atlantisAuction: AtlantisAuction;
let atlantisAuctionInterface: AtlantisAuctionInterface;
let atlantisPlanets: AtlantisPlanets;

// Constants
let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('AtlantisAuction', function () {
  beforeEach(async function () {
    // Get Owner Signer
    [owner] = await ethers.getSigners();

    // We will use index 1-12 signers for testing
    signers = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['Phase1', 'Mock']);
    atlantisAuction = await ethers.getContract('AtlantisAuction', owner);
    atlantisPlanets = await ethers.getContract('MockAtlantisPlanets', owner);
  });

  describe('Bidding', function () {
    beforeEach(async function () {
      // Setup Test
    });

    it('should set bid', async function () {
      // Owner Bid 100 ETH
      let tx = await atlantisAuction.bid({ value: ethers.utils.parseEther('1000') });
      let receipt = await tx.wait();

      // Check Bid
      let bid = await atlantisAuction.getAllActiveBids();

      // get first bid
      let firstBid = bid[0];
      expect(firstBid.bidder).to.equal(owner.address);
      expect(firstBid.amount).to.equal(ethers.utils.parseEther('1000'));
      expect(firstBid.bidTime).to.not.equal(0);
    });

    it('should set bids', async function () {
      // Owner Bid 100 ETH
      for (let i = 1; i < 13; i++) {
        // console.log(i);

        let tx = await atlantisAuction.connect(signers[i]).bid({ value: ethers.utils.parseEther('1000') });
        let receipt = await tx.wait();
      }
      // Check Bids
      let bid = await atlantisAuction.getAllActiveBids();
      //  console.log('🚀 | bid', bid);

      // get first bid
    });
  });
  describe('Invalid Bidding', function () {
    beforeEach(async function () {
      // Setup Test
    });

    it('should not bid if does not meet min bid', async function () {
      // Owner Bid 100 ETH
      await expect(atlantisAuction.bid({ value: ethers.utils.parseEther('999') })).to.be.revertedWithCustomError(
        atlantisAuction,
        'ReservePriceNotMet'
      );
    });
    it('should not bid if lower than lowest bidder', async function () {
      for (let i = 1; i < 13; i++) {
        // console.log(i);

        let tx = await atlantisAuction.connect(signers[i]).bid({ value: ethers.utils.parseEther('2000') });
      }
      // Owner Bid 100 ETH
      await expect(atlantisAuction.bid({ value: ethers.utils.parseEther('1999') })).to.be.revertedWithCustomError(
        atlantisAuction,
        'IncrementalPriceNotMet'
      );
    });
    it('should not bid if lower than lowest bidder', async function () {
      for (let i = 1; i < 13; i++) {
        // console.log(i);

        let tx = await atlantisAuction
          .connect(signers[i])
          .bid({ value: ethers.utils.parseEther('1500').add(ethers.utils.parseEther('100').mul(i - 1)) });
      }
      // Check Bids
      let bid = await atlantisAuction.getAllActiveBids();
      //console.log('🚀 | bid', bid);

      // Exactly 1 more than the lowest bid (should revert)
      await expect(atlantisAuction.bid({ value: ethers.utils.parseEther('1501') })).to.be.revertedWithCustomError(
        atlantisAuction,
        'IncrementalPriceNotMet'
      );

      // Exactly 1% more than the lowest bid (should revert)
      await expect(
        atlantisAuction.bid({ value: ethers.utils.parseEther('1500').mul(101).div(100) })
      ).to.be.revertedWithCustomError(atlantisAuction, 'IncrementalPriceNotMet');

      // Exactly 10% more than the lowest bid
      await atlantisAuction.bid({ value: ethers.utils.parseEther('1600').mul(110).div(100) });
    });

    it('should not bid if does not min increment', async function () {
      // Owner Bid 100 ETH
      await atlantisAuction.bid({ value: ethers.utils.parseEther('1000') });
      await expect(atlantisAuction.bid({ value: ethers.utils.parseEther('1') })).to.be.revertedWithCustomError(
        atlantisAuction,
        'BidIncrementTooLow'
      );
    });

    it('length of active bids should not exceed 12', async function () {
      // Place 20 Bids
      for (let i = 1; i < 20; i++) {
        // console.log(i);

        let tx = await atlantisAuction
          .connect(signers[i])
          .bid({ value: ethers.utils.parseEther('1500').add(ethers.utils.parseEther('100').mul(i - 1)) });
        let receipt = await tx.wait();
      }
      // Owner Bid 100 ETH
      let bids = await atlantisAuction.getAllActiveBids();

      // Expect 12 bids
      expect(bids.length).to.equal(12);
    });
  });
  describe('End Auction', function () {
    beforeEach(async function () {
      // Setup Test
    });

    it('should end auction', async function () {
      // Place 12 Bids
      for (let i = 1; i < 13; i++) {
        // console.log(i);

        let tx = await atlantisAuction
          .connect(signers[i])
          .bid({ value: ethers.utils.parseEther('3000').add(ethers.utils.parseEther('100').mul(i - 1)) });
      }

      // End Auction

      // Get All Active Bids
      let bids = await atlantisAuction.getAllActiveBids();
      let _tempBids = [...bids];

      // sort bids by amount
      _tempBids = _tempBids.sort((a, b) => {
        if (a[1].gt(b[1])) {
          return -1;
        } else if (a[1].lt(b[1])) {
          return 1;
        } else {
          return 0;
        }
      });

      await expect(atlantisAuction.settleAuction(_tempBids)).to.be.revertedWithCustomError(
        atlantisAuction,
        'AuctionStillLive'
      );

      // Advance Time
      await ethers.provider.send('evm_increaseTime', [86400 * 1 + 1]);
      await atlantisAuction.settleAuction(_tempBids);

      // Expect auction to be settled
      expect(await atlantisAuction.auctionSettled()).to.equal(true);
    });
  });
});
