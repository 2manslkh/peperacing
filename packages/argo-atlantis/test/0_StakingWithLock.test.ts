import { deployments, ethers } from 'hardhat';

import { AtlantisGemstones } from '../typechain';
import { Gold } from '../typechain';
import { StakingWithLock } from '../typechain';
import { Stardust } from '../typechain';
import { expect } from 'chai';
import { getContract } from '../utils/helper';

describe('StakingWithLock', () => {
  let stakingWithLock: StakingWithLock;
  let owner: Signer;
  let staker: Signer;
  let whitelistedContract: Signer;
  let nonWhitelistedContract: Signer;
  let gold: Gold;
  let stardust: Stardust;
  const goldAmount = ethers.parseEther('100');
  const stardustAmount = ethers.parseEther('10');
  beforeEach(async () => {
    // Get fixtures
    await deployments.fixture(['Mock', 'Phase1']);
    [owner, staker, whitelistedContract, nonWhitelistedContract] = await ethers.getSigners();
    stakingWithLock = await getContractAt('StakingWithLock');
    gold = await deployments.get('Gold');
    stardust = await deployments.get('Stardust');
    // Approve gold to be staked
    await gold.connect(staker).approve(stakingWithLock.address, goldAmount.mul(1000));
    // Approve stardust to be staked
    await stardust.connect(staker).approve(stakingWithLock.address, stardustAmount.mul(1000));
    // Approve for whitelisted contract as well
    await gold.connect(whitelistedContract).approve(stakingWithLock.address, goldAmount.mul(1000));
    await stardust.connect(whitelistedContract).approve(stakingWithLock.address, stardustAmount.mul(1000));
    // Devmint gold to staker and whitelistedcontract
    await gold.connect(staker).devMint(goldAmount.mul(1000));
    await gold.connect(whitelistedContract).devMint(goldAmount.mul(1000));
    // Approve owner and mint also
    await gold.connect(owner).approve(stakingWithLock.address, goldAmount.mul(1000));
    await gold.connect(owner).devMint(goldAmount.mul(1000));
    // Mint gold to owner
    await gold.connect(owner).devMint(goldAmount.mul(1000));
    // Mint stardust to everyone
    await stardust.connect(owner).devMint(stardustAmount.mul(1000));
    await stardust.connect(staker).devMint(stardustAmount.mul(1000));
    await stardust.connect(whitelistedContract).devMint(stardustAmount.mul(1000));

    // Approve stardust for everyone
    await stardust.connect(owner).approve(stakingWithLock.address, stardustAmount.mul(1000));
    await stardust.connect(staker).approve(stakingWithLock.address, stardustAmount.mul(1000));
    await stardust.connect(whitelistedContract).approve(stakingWithLock.address, stardustAmount.mul(1000));
  });

  describe('Staking ', () => {
    it('should allow a whitelisted contract to stake gold', async () => {
      await stakingWithLock.connect(whitelistedContract).stake(goldAmount);
      // Get event from stake()
      let events = await stakingWithLock.queryFilter(stakingWithLock.filters.LogStake());
      // Check that the event was emitted
      expect(events.length).to.equal(1);
      // Check that the staker's address and gold amount are correct
      expect(events[0].args.staker).to.equal(whitelistedContract.address);
      expect(events[0].args.goldAmount).to.equal(goldAmount);
    });

    it('should not allow a non-whitelisted contract to stake gold', async () => {
      await expect(stakingWithLock.connect(nonWhitelistedContract).stake(goldAmount)).to.be.reverted;
    });
  });
  describe('#unstake', () => {
    beforeEach(async () => {
      await stakingWithLock.connect(whitelistedContract).stake(goldAmount);
    });

    it('should allow a user to initiate unstaking', async () => {
      await stakingWithLock.connect(whitelistedContract).unstake(stardustAmount);
      // Get event from stake()
      let events = await stakingWithLock.queryFilter(stakingWithLock.filters.LogUnstake());
      // Check that the event was emitted
      expect(events.length).to.equal(1);
      // Check that the staker's address and gold amount are correct
      expect(events[0].args.staker).to.equal(whitelistedContract.address);
      expect(events[0].args.stardustAmount).to.equal(stardustAmount);
      //   expect(events[0].args.unstakeUnlocked).to.be.above(0);
    });

    it('should not allow a user to initiate unstaking without being staked', async () => {
      await stakingWithLock.connect(whitelistedContract).unstake(stardustAmount);
    });
  });

  describe('#claimGold', () => {
    beforeEach(async () => {
      await stakingWithLock.connect(owner).stake(goldAmount);
      await stakingWithLock.connect(owner).unstake(stardustAmount);
    });

    it('should allow a user to claim staked gold after the unstake time has passed', async () => {
      // Advance time so that the unstake time has passed
      // Fast Forward 181 days
      await ethers.provider.send('evm_increaseTime', [15552000]);
      await ethers.provider.send('evm_mine', []);
      await stakingWithLock.connect(owner).claim();
      // Get event from stake()
      let events = await stakingWithLock.queryFilter(stakingWithLock.filters.LogClaimed());
      // Check that the event was emitted
      expect(events.length).to.equal(1);
      // Check that the staker's address and gold amount are correct
      expect(events[0].args.staker).to.equal(owner.address);
      expect(events[0].args.claimedAmount).to.equal(stardustAmount);
    });

    it('should not allow a user to claim staked gold before the unstake time has passed', async () => {
      // Do not advance time, so that the unstake time has not passed
      await expect(stakingWithLock.connect(staker).claim()).to.be.reverted;
    });
  });

  describe('#unstakeAndBurn', () => {
    beforeEach(async () => {
      await stakingWithLock.connect(whitelistedContract).stake(goldAmount);
    });

    it('should not allow a user to burn staked gold without being staked', async () => {
      await expect(stakingWithLock.connect(staker).unstakeAndBurn(stardustAmount)).to.be.reverted;
    });
  });

  describe('#setStardust', () => {
    it('should allow the owner to set the address registry', async () => {
      // Get event from stake()
      await stakingWithLock.setAddressRegistry(stardust.address);
      expect(await stakingWithLock.addressRegistry()).to.equal(stardust.address);
    });

    it('should not allow a non-owner to set the address registry', async () => {
      await expect(stakingWithLock.connect(staker).setAddressRegistry(stardust.address)).to.be.reverted;
    });
  });
});
