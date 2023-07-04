import 'dotenv/config';

import {
  ATLANTIS_PLANETS_CAP,
  GEMSTONES_500,
  OTHER_PLANET_TOKEN_ID,
  TOKENS_1_000,
  TOKENS_1_000_000_000,
  TOKENS_500_000_000,
  USER_PLANET_TOKEN_ID,
} from './../utils/constants';
import { BigNumber, BigNumberish, Wallet } from 'ethers';
import { chunkArray, getGemstoneArray } from '../utils/helper';
import { deployments, ethers } from 'hardhat';

import { Atlantis } from '../typechain/contracts/Atlantis';
import { AtlantisFaucet } from '../typechain';
import { AtlantisGemstones } from './../typechain/contracts/AtlantisGemstones';
import { AtlantisPlanets } from './../typechain/contracts/AtlantisPlanets';
import { Gold } from '../typechain/contracts/Gold';
import { MockArgonauts } from '../typechain/contracts/common/MockArgonauts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { StakingWithLock } from './../typechain/contracts/StakingWithLock';
import { Stardust } from './../typechain/contracts/Stardust';
import { XARGO } from './../typechain/contracts/common/MockXARGO.sol/XARGO';
import { expect } from 'chai';

let owner: SignerWithAddress;
let user: SignerWithAddress;
let atlantis: Atlantis;
let argonauts: MockArgonauts;
let atlantisPlanets: AtlantisPlanets;
let atlantisGemstones: AtlantisGemstones;
let stardust: Stardust;
let xargo: XARGO;
let stakingWithLock: StakingWithLock;
let gold: Gold;
let faucet: AtlantisFaucet;
// Constants
let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
let PUBLIC_MINT_COST: BigNumberish;

const idArray = Array.from({ length: ATLANTIS_PLANETS_CAP }, (v, k) => k + 1);
const orbitArrayOnes = Array.from({ length: ATLANTIS_PLANETS_CAP }, (v, k) => 1);
const elementArray = Array.from({ length: ATLANTIS_PLANETS_CAP }, (v, k) => k % 3);

/**
 * Phase 2 Fixture
 * - All Planets Minted Out
 * - All Orbits are set
 * - All Elements are set
 * - All Upgrade Requirements are set
 * - 500 of each Gemstones minted to user
 * - 1 Billion XARGO Minted to user
 * - 1 Billion Gold is Staked to StakingWithLock
 * - 1 Billion Stardust Transferred to Atlantis (from staking)
 * - Atlantis is approved to AtlantisPlanets
 * - AtlantisGemstones is approved to AtlantisPlanets
 * - Stardust is approved to StakingWithLock
 * - Gold is approved to StakingWithLock
 * - XARGO is approved to AtlantisPlanets
 * - Approve Argonauts to Atlantis as stakable collection
 * - Argonauts is approved to Atlantis
 */
const setupPhase2 = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers }, options) => {
  [owner, user] = await ethers.getSigners();

  await deployments.fixture(['Phase1', 'Phase2', 'Mock']);

  atlantis = await deployments.get('Atlantis', owner);
  atlantisPlanets = await deployments.get('AtlantisPlanets', owner);
  atlantisGemstones = await deployments.get('AtlantisGemstones', owner);
  argonauts = await deployments.get('MockArgonauts', owner);
  stardust = await deployments.get('Stardust', owner);
  xargo = await deployments.get('XARGO', owner);
  stakingWithLock = await deployments.get('StakingWithLock', owner);
  gold = await deployments.get('Gold', owner);
  // Set Stage to 2
  await atlantisPlanets.setStage(2);
  // Set Public Mint Cost to 0
  await atlantisPlanets.setPublicMintPrice(0);

  // expect(await argonauts.ownerOf(1)).to.equal(user.address);

  // Mint Out All Planets to Owner 6000
  let tx;
  for (let i = 0; i < 20; i += 1) {
    tx = await atlantisPlanets.mint(300);
  }
  // Create an array with levels from 1-50
  let levelArray = Array.from({ length: 50 }, (v, k) => k + 1);
  // Create an array where the first 9 is 10, then next 10 is 20, then next 10 is 30, then next 10 is 40, then last 11 is 50
  let gemstoneArray = Array.from({ length: 50 }, (v, k) => {
    if (k < 9) {
      return 10;
    } else if (k < 19) {
      return 20;
    } else if (k < 29) {
      return 30;
    } else if (k < 39) {
      return 40;
    } else if (k < 49) {
      return 50;
    } else {
      return 60;
    }
  });
  // Set gemstone rate for atlantis
  await atlantis.setGemstoneRate(levelArray, gemstoneArray);
  await atlantis.setNftGemstoneMultiplier([10, 12, 14, 16]);
  await atlantis.setRarityMultiplier([10, 12, 14, 16]);
  // Transfer tokenId 1 to user
  await atlantisPlanets.transferFrom(owner.address, user.address, USER_PLANET_TOKEN_ID);

  // Prepare Orbit Data, Element Data, and Level Up Data
  let orbitArrayOnesChunked = chunkArray(orbitArrayOnes, 500);
  let elementArrayChunked = chunkArray(elementArray, 500);
  let idArrayChunked = chunkArray(idArray, 500);
  let levelUpGemstone: string = await getGemstoneArray('./data/gemstone_requirements_v2.csv');

  await atlantisPlanets.setStage(3);

  // Set Orbits
  for (let i = 0; i < idArrayChunked.length; i++) {
    await atlantisPlanets.setPlanetOrbits(idArrayChunked[i], orbitArrayOnesChunked[i]);
  }

  // Set Elements
  for (let i = 0; i < idArrayChunked.length; i++) {
    await atlantisPlanets.setPlanetElements(idArrayChunked[i], elementArrayChunked[i]);
  }

  // Set Upgrade Requirements
  await atlantisPlanets.setLevelUpGemstone(levelUpGemstone);

  // Give user 500 of each Gemstones
  for (let i = 1; i <= 12; i++) {
    // Create collection
    await atlantisGemstones.connect(owner).mint(user.address, i, GEMSTONES_500);
    expect(await atlantisGemstones.balanceOf(user.address, i)).to.equal(GEMSTONES_500);
  }

  // Mint XARGO to user
  await xargo.connect(user).devMint(TOKENS_1_000_000_000);

  // Stake gold to get stardust from owner account
  await gold.connect(owner).approve(stakingWithLock.address, TOKENS_1_000_000_000);
  await stakingWithLock.connect(owner).stake(TOKENS_1_000_000_000);

  // Transfer 500 Million Stardust to Atlantis and 500 Million to user
  await stardust.connect(owner).transfer(atlantis.address, TOKENS_500_000_000);
  await stardust.connect(owner).transfer(user.address, TOKENS_500_000_000);

  // Approve Atlantis to AtlantisPlanets from user
  await atlantisPlanets.connect(user).setApprovalForAll(atlantis.address, true);
  // Approve AtlantisPlanets to AtlantisGemstones from users
  await atlantisGemstones.connect(user).setApprovalForAll(atlantisPlanets.address, true);
  // Approve Stardust to StakingWithLock from user
  await stardust.connect(user).approve(stakingWithLock.address, TOKENS_1_000_000_000);
  // Approve Gold to StakingWithLock from user
  await gold.connect(user).approve(stakingWithLock.address, TOKENS_1_000_000_000);
  // Approve XARGO to AtlantisPlanets from user
  await xargo.connect(user).approve(atlantisPlanets.address, TOKENS_1_000_000_000);

  // Approve Argonauts to Atlantis as stakable collection
  await atlantis.connect(owner).setWhitelistedCollections([argonauts.address], true);

  // Approve Argonauts to Atlantis
  await argonauts.connect(user).setApprovalForAll(atlantis.address, true);

  await atlantisPlanets.setStage(4).then((tx) => tx.wait());

  return {
    owner,
    user,
    atlantis,
    atlantisPlanets,
    atlantisGemstones,
    argonauts,
    stardust,
    xargo,
    stakingWithLock,
    gold,
  };
});

describe('Atlantis', function () {
  beforeEach(async function () {
    // Get Signers
    // Load Phase 2 Fixture
    ({ owner, user, atlantis, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
      await setupPhase2());

    // Setup Constants
    PUBLIC_MINT_COST = await atlantisPlanets.publicMintPrice();
  });

  describe('Constants', function () {
    it('Address Registry is set', async function () {
      expect(await atlantis.addressRegistry()).to.not.equal(ZERO_ADDRESS);
    });

    it('Default expeditionDuration is set to 1.5 days', async function () {
      expect(await atlantis.expeditionDuration()).to.equal(129600);
    });
  });

  describe('Expedition', function () {
    beforeEach(async function () { });
    it('should calculate correct gemstoneGenerated', async function () {
      // Get gemstone Generated with these test cases

      let gemstoneGenerated = await atlantis.gemstoneGenerated(1, 0, 0);
      expect(gemstoneGenerated).to.equal(10);
      gemstoneGenerated = await atlantis.gemstoneGenerated(1, 3, 0);
      expect(gemstoneGenerated).to.equal(16);
      gemstoneGenerated = await atlantis.gemstoneGenerated(10, 0, 0);
      expect(gemstoneGenerated).to.equal(20);
      gemstoneGenerated = await atlantis.gemstoneGenerated(20, 0, 1);
      expect(gemstoneGenerated).to.equal(36);
      gemstoneGenerated = await atlantis.gemstoneGenerated(20, 1, 1);
      expect(gemstoneGenerated).to.equal(44);
      gemstoneGenerated = await atlantis.gemstoneGenerated(30, 0, 2);
      expect(gemstoneGenerated).to.equal(56);
      gemstoneGenerated = await atlantis.gemstoneGenerated(30, 2, 2);
      expect(gemstoneGenerated).to.equal(79);
      gemstoneGenerated = await atlantis.gemstoneGenerated(30, 3, 2);
      expect(gemstoneGenerated).to.equal(90);
    });

    it('should calculate correct stardust', async function () {
      // Get gemstone Generated with these test cases
      await atlantis.setBaseStardustRate(ethers.parseEther('50'));
      let stardustGenerated = await atlantis.calculateStardustPerExpedition(1, 0);
      expect(stardustGenerated).to.equal(ethers.parseEther('50'));
      stardustGenerated = await atlantis.calculateStardustPerExpedition(10, 0);
      expect(stardustGenerated).to.equal(ethers.parseEther('90.5'));
      stardustGenerated = await atlantis.calculateStardustPerExpedition(20, 0);
      expect(stardustGenerated).to.equal(ethers.parseEther('230.5'));
      stardustGenerated = await atlantis.calculateStardustPerExpedition(20, 1);
      expect(stardustGenerated).to.equal(ethers.parseEther('276.6'));
      stardustGenerated = await atlantis.calculateStardustPerExpedition(20, 2);
      expect(stardustGenerated).to.equal(ethers.parseEther('322.7'));
      stardustGenerated = await atlantis.calculateStardustPerExpedition(20, 3);
      expect(stardustGenerated).to.equal(ethers.parseEther('368.8'));
    });
    it('should start and end expedition receiving correct rewards', async function () {
      // Start Expedition
      await atlantis
        .connect(user)
        .startExpedition(USER_PLANET_TOKEN_ID, [], [], { value: ethers.parseEther('1') });

      // Should Retrieve Correct Expedition details
      let expedition = await atlantis.expeditions(0);
      expect(expedition.planetId).to.equal(USER_PLANET_TOKEN_ID);
      // Expect owner to be address
      expect(expedition.owner).to.equal(user.address);
      // Get planet
      let planet = await atlantisPlanets.planets(USER_PLANET_TOKEN_ID);
      // Log element of planet
      console.log('Element: ', planet.element);
      // Fast Forward 3 days
      await ethers.provider.send('evm_increaseTime', [259200]);
      await ethers.provider.send('evm_mine', []);

      // Stardust Balance Before
      let stardustBalanceBefore = await stardust.balanceOf(user.address);
      // gemstones Balance Before
      let gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      // End Expedition
      await atlantis.connect(user).endExpedition(0);
      // Calculate rewards from expedition
      let rewards = await atlantis.calculateRewards(0);
      // Calculate if rewards are correct
      let stardustBalanceAfter = await stardust.balanceOf(user.address);
      let gemstonesBalanceAfter = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      expect(stardustBalanceAfter.sub(stardustBalanceBefore)).to.equal(rewards[2]);
      expect(gemstonesBalanceAfter.sub(gemstonesBalanceBefore)).to.equal(rewards[0]);
    });

    it('should start and end expedition with level 20 planet receiving correct rewards', async function () {
      // Get Level 20 Planet
      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 19);

      // Start Expedition
      await atlantis
        .connect(user)
        .startExpedition(USER_PLANET_TOKEN_ID, [], [], { value: ethers.parseEther('1') });

      // Should Retrieve Correct Expedition details
      let expedition = await atlantis.expeditions(0);
      expect(expedition.planetId).to.equal(USER_PLANET_TOKEN_ID);
      // Expect owner to be address
      expect(expedition.owner).to.equal(user.address);
      // Get planet
      let planet = await atlantisPlanets.planets(USER_PLANET_TOKEN_ID);
      // Log element of planet
      console.log('Element: ', planet.element);
      // Fast Forward 3 days
      await ethers.provider.send('evm_increaseTime', [259200]);
      await ethers.provider.send('evm_mine', []);

      // Stardust Balance Before
      let stardustBalanceBefore = await stardust.balanceOf(user.address);
      // gemstones Balance Before
      let gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      // End Expedition
      await atlantis.connect(user).endExpedition(0);
      // Calculate rewards from expedition
      let rewards = await atlantis.calculateRewards(0);
      // Calculate if rewards are correct
      let stardustBalanceAfter = await stardust.balanceOf(user.address);
      let gemstonesBalanceAfter = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      expect(stardustBalanceAfter.sub(stardustBalanceBefore)).to.equal(rewards[2]);
      expect(gemstonesBalanceAfter.sub(gemstonesBalanceBefore)).to.equal(rewards[0]);
    });

    it('should start and end expedition with level 30 planet receiving correct rewards', async function () {
      // Get Level 30 Planet
      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 29);

      // Start Expedition
      await atlantis
        .connect(user)
        .startExpedition(USER_PLANET_TOKEN_ID, [], [], { value: ethers.parseEther('1') });

      // Should Retrieve Correct Expedition details
      let expedition = await atlantis.expeditions(0);
      expect(expedition.planetId).to.equal(USER_PLANET_TOKEN_ID);
      // Expect owner to be address
      expect(expedition.owner).to.equal(user.address);
      // Get planet
      let planet = await atlantisPlanets.planets(USER_PLANET_TOKEN_ID);
      // Log element of planet
      console.log('Element: ', planet.element);
      // Fast Forward 3 days
      await ethers.provider.send('evm_increaseTime', [259200]);
      await ethers.provider.send('evm_mine', []);

      // Stardust Balance Before
      let stardustBalanceBefore = await stardust.balanceOf(user.address);
      // gemstones Balance Before
      let gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      // End Expedition
      await atlantis.connect(user).endExpedition(0);
      // Calculate rewards from expedition
      let rewards = await atlantis.calculateRewards(0);
      // Calculate if rewards are correct
      let stardustBalanceAfter = await stardust.balanceOf(user.address);
      let gemstonesBalanceAfter = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      expect(stardustBalanceAfter.sub(stardustBalanceBefore)).to.equal(rewards[2]);
      expect(gemstonesBalanceAfter.sub(gemstonesBalanceBefore)).to.equal(rewards[0]);
    });

    it('should start and end expedition with level 40 planet receiving correct rewards', async function () {
      // Get Level 40 Planet
      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 39);
      await atlantis.connect(owner).setTreasury(owner.address);
      // Log balance before expedition
      let balanceBefore = await ethers.provider.getBalance(user.address);
      console.log('Balance Before: ', ethers.utils.formatEther(balanceBefore));
      // Start Expedition
      await atlantis
        .connect(user)
        .startExpedition(USER_PLANET_TOKEN_ID, [], [], { value: ethers.parseEther('1') });
      // Log balance after expedition
      let balanceAfter = await ethers.provider.getBalance(user.address);
      console.log('Balance After: ', ethers.utils.formatEther(balanceAfter));

      // Should Retrieve Correct Expedition details
      let expedition = await atlantis.expeditions(0);
      expect(expedition.planetId).to.equal(USER_PLANET_TOKEN_ID);
      // Expect owner to be address
      expect(expedition.owner).to.equal(user.address);
      // Get planet
      let planet = await atlantisPlanets.planets(USER_PLANET_TOKEN_ID);
      // Log element of planet
      console.log('Element: ', planet.element);
      // Fast Forward 3 days
      await ethers.provider.send('evm_increaseTime', [259200]);
      await ethers.provider.send('evm_mine', []);

      // Stardust Balance Before
      let stardustBalanceBefore = await stardust.balanceOf(user.address);
      // gemstones Balance Before
      let gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      // End Expedition
      await atlantis.connect(user).endExpedition(0);
      // Calculate rewards from expedition
      let rewards = await atlantis.calculateRewards(0);
      // Calculate if rewards are correct
      let stardustBalanceAfter = await stardust.balanceOf(user.address);
      let gemstonesBalanceAfter = await atlantisGemstones.balanceOf(user.address, planet.element + 1);
      expect(stardustBalanceAfter.sub(stardustBalanceBefore)).to.equal(rewards[2]);
      expect(gemstonesBalanceAfter.sub(gemstonesBalanceBefore)).to.equal(rewards[0]);
    });

    it('should start expedition with staked argonauts', async function () {
      // Fuse gemstones
      await atlantisGemstones.connect(user).fuseGemstones(1, 4, 15);
      // Upgrade planet
      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 19);
      // Check planet level
      let planet = await atlantisPlanets.planets(USER_PLANET_TOKEN_ID);
      expect(planet.level).to.equal(20);

      // Start expedition
      await atlantis
        .connect(user)
        .startExpedition(USER_PLANET_TOKEN_ID, [argonauts.address], [0], { value: ethers.parseEther('1') });
      // Check expedition
      let expedition = await atlantis.getExpeditionInfo(0);
      expect(expedition.collectionAddresses[0]).to.equal(argonauts.address);
      expect(expedition.tokenIds[0]).to.equal(0);
      expect(expedition.endTime.sub(expedition.startTime)).to.equal(await atlantis.expeditionDuration());
    });

    it('should not start expedition if not owner of planet', async function () {
      await expect(
        atlantis.connect(user).startExpedition(OTHER_PLANET_TOKEN_ID, [], [], { value: ethers.parseEther('1') })
      ).to.be.revertedWith('ERC721: caller is not token owner or approved');
    });

    it('should not start expedition if number of nfts staked exceeds 1 on planet evolution level 1', async function () {
      await expect(
        atlantis
          .connect(user)
          .startExpedition(USER_PLANET_TOKEN_ID, [argonauts.address], [0], { value: ethers.parseEther('1') })
      ).to.be.revertedWithCustomError(atlantis, 'InvalidExpeditionInput');
    });

    it('should not start expedition if not owner of nft staked', async function () {
      // Fuse Gemstones
      await atlantisGemstones.connect(user).fuseGemstones(1, 4, 15);
      // Upgrade planet
      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 19);
      await expect(
        atlantis
          .connect(user)
          .startExpedition(USER_PLANET_TOKEN_ID, [argonauts.address], [1], { value: ethers.parseEther('1') })
      ).to.be.revertedWithCustomError(argonauts, 'TransferFromIncorrectOwner');
    });
    it('should receive back staked nfts', async function () {
      // Check argonauts balance before
      let argonautsBalanceBefore = await argonauts.balanceOf(user.address);
      // Check planets balance before
      let planetsBalanceBefore = await atlantisPlanets.balanceOf(user.address);
      // Fuse Gemstones
      await atlantisGemstones.connect(user).fuseGemstones(1, 4, 15);
      // Upgrade planet
      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 19);
      // Start expedition
      await atlantis
        .connect(user)
        .startExpedition(USER_PLANET_TOKEN_ID, [argonauts.address], [0], { value: ethers.parseEther('1') });
      // Check that argonauts and planets are transferred
      expect(await argonauts.balanceOf(user.address)).to.equal(argonautsBalanceBefore.sub(1));
      expect(await atlantisPlanets.balanceOf(user.address)).to.equal(planetsBalanceBefore.sub(1));

      // Fast Forward 3 days
      await ethers.provider.send('evm_increaseTime', [259200]);
      await ethers.provider.send('evm_mine', []);

      // End expedition
      await atlantis.connect(user).endExpedition(0);
      // Check that argonauts and planets are transferred back
      expect(await argonauts.balanceOf(user.address)).to.equal(argonautsBalanceBefore);
      expect(await atlantisPlanets.balanceOf(user.address)).to.equal(planetsBalanceBefore);

      it('should not end expedition if before expeditionDuration', async function () {
        // Start Expedition
        await atlantis
          .connect(user)
          .startExpedition(USER_PLANET_TOKEN_ID, [], [], { value: ethers.parseEther('1') });

        // Should Retrieve Correct Expedition details
        let expedition = await atlantis.expeditions(0);

        // End Expedition
        await expect(atlantis.connect(user).endExpedition(0)).to.be.revertedWithCustomError(
          atlantis,
          'ExpeditionInProgress'
        );
      });

      it('should not end expedition if does not exist', async function () {
        // End Expedition
        await expect(atlantis.connect(user).endExpedition(0)).to.be.revertedWithCustomError(
          atlantis,
          'NotOwnerOfExpedition'
        );
      });

      it('should not end expedition if not owner of expedition', async function () {
        // Start Expedition
        await atlantis
          .connect(user)
          .startExpedition(USER_PLANET_TOKEN_ID, [], [], { value: ethers.parseEther('1') });

        // Should Retrieve Correct Expedition details
        let expedition = await atlantis.expeditions(0);

        // Fast Forward 3 days
        await ethers.provider.send('evm_increaseTime', [259200]);
        await ethers.provider.send('evm_mine', []);

        // End Expedition
        await expect(atlantis.connect(owner).endExpedition(0)).to.be.revertedWithCustomError(
          atlantis,
          'NotOwnerOfExpedition'
        );
      });
    });

    describe('Admin Functions', function () {
      beforeEach(async function () {
        // Mint Mock Argonauts to User
        await argonauts.mint(1);
      });

      it('should set stardust contract address', async function () {
        // Set stardust contract address
        await atlantis.setAddressRegistry(stardust.address);
        expect(await atlantis.addressRegistry()).to.equal(stardust.address);
      });

      it('should not set stardust contract address if not owner', async function () {
        // Set stardust contract address
        await expect(atlantis.connect(user).setAddressRegistry(stardust.address)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });

      it('should set expedition duration', async function () {
        // Set expedition duration
        await atlantis.setExpeditionDuration(86400);
        expect(await atlantis.expeditionDuration()).to.equal(86400);
      });

      it('should not set expedition duration if not owner', async function () {
        // Set expedition duration
        await expect(atlantis.connect(user).setExpeditionDuration(86400)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });

      it('should set gemstone rate', async function () {
        // Set gemstone Rate
        await expect(atlantis.connect(user).setGemstoneRate([1, 1, 1, 1], [1, 2, 3, 4])).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should set nft gemstone multiplier');
      it('should set AtlantisGemstones');
      it('should set AtlantisPlanets');
    });
  });
});
