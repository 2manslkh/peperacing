import 'dotenv/config';

import {
  ATLANTIS_PLANETS_CAP,
  GEMSTONES_500,
  OTHER_PLANET_TOKEN_ID,
  TOKENS_1_000,
  TOKENS_1_000_000_000,
  USER_PLANET_TOKEN_ID,
} from '../utils/constants';
import { BigNumber, Wallet } from 'ethers';

import { AtlantisGemstones } from '../typechain/contracts/AtlantisGemstones';
import { Gold } from '../typechain/contracts/Gold';
import { MockArgonauts } from '../typechain/contracts/common/MockArgonauts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { StakingWithLock } from '../typechain/contracts/StakingWithLock';
import { Stardust } from '../typechain/contracts/Stardust';
import { expect } from 'chai';

const { ethers, deployments } = require('hardhat');

let owner: SignerWithAddress;
let user1: SignerWithAddress;

let atlantisGemstones: AtlantisGemstones;
let argonauts: MockArgonauts;
let stardust: Stardust;
let stakingWithLock: StakingWithLock;
let gold: Gold;
// Constants
let BASE_URI = 'ipfs://QmaHbdibWgKYRToaseoJXpEgG9gUk1pHJh3WwrAp3XsVvd/';

describe('AtlantisGemstones', function () {
  beforeEach(async function () {
    // Get Signers
    [owner, user1] = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['Phase1', 'Mock']);
    atlantisGemstones = await ethers.getContract('AtlantisGemstones', owner);
    stardust = await ethers.getContract('Stardust', owner);
    stakingWithLock = await ethers.getContract('StakingWithLock', owner);
    gold = await ethers.getContract('Gold', owner);
  });

  describe('Constants', function () {
    it('Name is set to Atlantis Gemstones', async function () {
      expect(await atlantisGemstones.name()).to.be.equals('Atlantis Gemstones');
    });

    it('Symbol is set to GEMSTONES', async function () {
      expect(await atlantisGemstones.symbol()).to.be.equals('GEMSTONES');
    });

    it('BaseURI is set', async function () {
      expect(await atlantisGemstones.baseTokenURI()).to.be.equals(BASE_URI);
    });
  });

  describe('Metadata', function () {
    beforeEach(async function () {
      // Gemstone token ids is in the following sequence:
      // 1 - Fire 1
      // 2 - Lightning 1
      // 3 - Steel 1
      // 4 - Fire 2
      // 5 - Lightning 2
      // 6 - Steel 2
      // 7 - Fire 3
      // 8 - Lightning 3
      // 9 - Steel 3
      // 10 - Fire 4
      // 11 - Lightning 4
      // 12 - Steel 4
      for (let i = 1; i <= 12; i++) {
        await atlantisGemstones.mint(owner.address, i, 1);
        expect(await atlantisGemstones.totalSupply(i)).to.be.equals(1);
        console.log(await atlantisGemstones.uri(i));
      }
    });

    it('should return correct tokenURI', async function () {
      // Log all uri
      for (let i = 1; i <= 12; i++) {
        console.log(await atlantisGemstones.uri(i));
      }
    });
  });

  describe('Minting', function () {
    beforeEach(async function () {});

    it('should not be directly mintable', async function () {
      await expect(atlantisGemstones.connect(user1).mint(user1.address, 1, 1)).to.be.revertedWithCustomError(
        atlantisGemstones,
        'OnlyAtlantisOrOwner'
      );
    });

    it('should not mint non-existent token', async function () {
      await expect(atlantisGemstones.connect(owner).mint(user1.address, 13, 1)).to.be.revertedWithCustomError(
        atlantisGemstones,
        'NonExistentToken'
      );
    });
  });

  describe('Upgrading', function () {
    beforeEach(async function () {
      for (let i = 1; i <= 12; i++) {
        await atlantisGemstones.connect(owner).mint(user1.address, i, 3);
      }
      // Dev Mint Stardust Tokens
      await stardust.connect(user1).devMint(ethers.utils.parseEther('1000000'));
      expect(await stardust.balanceOf(user1.address)).to.equal(ethers.utils.parseEther('1000000'));

      // Approve Stardust to approve
      await stardust.connect(user1).approve(atlantisGemstones.address, ethers.utils.parseEther('1000000000'));
      expect(await stardust.allowance(user1.address, atlantisGemstones.address)).to.equal(
        ethers.utils.parseEther('1000000000')
      );
      // Approve Stardust to approve
      await stardust.connect(user1).approve(stakingWithLock.address, ethers.utils.parseEther('1000000000'));
      expect(await stardust.allowance(user1.address, stakingWithLock.address)).to.equal(
        ethers.utils.parseEther('1000000000')
      );
      // Mint gold to user1
      await gold.connect(user1).devMint(ethers.utils.parseEther('1000000'));
      // Stake gold in stakingwithLOck
      await gold.connect(user1).approve(stakingWithLock.address, ethers.utils.parseEther('1000000000'));
      await stakingWithLock.connect(user1).stake(ethers.utils.parseEther('1000000'));
    });

    // Gemstones Should be consumed
    // Upgraded Gemstones Should be minted to user
    // Stardust Tokens should be consumed
    it('should upgrade gemstone from tier 1 to tier 2', async function () {
      for (let i = 1; i <= 3; i++) {
        let currentBalance = await stardust.balanceOf(user1.address);
        console.log('currentBalance', currentBalance.toString());
        await atlantisGemstones.connect(user1).fuseGemstones(i, i + 3, 1);
        expect(await atlantisGemstones.balanceOf(user1.address, i)).to.be.equals(0);
        expect(await atlantisGemstones.balanceOf(user1.address, i + 3)).to.be.equals(4);
        expect(await stardust.balanceOf(user1.address)).to.be.equals(
          currentBalance.sub(ethers.utils.parseEther('200'))
        );
      }
    });
    it('should upgrade gemstone from tier 2 to tier 3', async function () {
      for (let i = 4; i <= 6; i++) {
        let currentBalance = await stardust.balanceOf(user1.address);

        await atlantisGemstones.connect(user1).fuseGemstones(i, i + 3, 1);
        expect(await atlantisGemstones.balanceOf(user1.address, i)).to.be.equals(0);
        expect(await atlantisGemstones.balanceOf(user1.address, i + 3)).to.be.equals(4);
        expect(await stardust.balanceOf(user1.address)).to.be.equals(
          currentBalance.sub(ethers.utils.parseEther('200'))
        );
      }
    });
    it('should upgrade gemstone from tier 3 to tier 4', async function () {
      for (let i = 7; i <= 9; i++) {
        let currentBalance = await stardust.balanceOf(user1.address);

        await atlantisGemstones.connect(user1).fuseGemstones(i, i + 3, 1);
        expect(await atlantisGemstones.balanceOf(user1.address, i)).to.be.equals(0);
        expect(await atlantisGemstones.balanceOf(user1.address, i + 3)).to.be.equals(4);
        expect(await stardust.balanceOf(user1.address)).to.be.equals(
          currentBalance.sub(ethers.utils.parseEther('200'))
        );
      }
    });
    it('should not upgrade tier 4 gemstones', async function () {
      await expect(atlantisGemstones.connect(user1).fuseGemstones(11, 14, 1)).to.be.revertedWithCustomError(
        atlantisGemstones,
        'NonExistentToken'
      );
    });
    it('should not upgrade invalid gemstone', async function () {
      await expect(atlantisGemstones.connect(user1).fuseGemstones(13, 16, 1)).to.be.revertedWithCustomError(
        atlantisGemstones,
        'NonExistentToken'
      );
    });
  });
  describe('Upgrading (Negative Tests)', function () {
    beforeEach(async function () {
      for (let i = 1; i <= 12; i++) {
        await atlantisGemstones.connect(owner).mint(owner.address, i, 99);
      }
      // Dev Mint Stardust Tokens
      await stardust.connect(user1).devMint(ethers.utils.parseEther('1000'));
      expect(await stardust.balanceOf(user1.address)).to.equal(ethers.utils.parseEther('1000'));

      // Approve stardust to approve
      await stardust.connect(user1).approve(stakingWithLock.address, ethers.utils.parseEther('1000'));
      // Approve stardust to gemstones contract
      await stardust.connect(user1).approve(atlantisGemstones.address, ethers.utils.parseEther('1000'));
      expect(await stardust.allowance(user1.address, stakingWithLock.address)).to.equal(
        ethers.utils.parseEther('1000')
      );
      // Approve stardust to approve
      await stardust.connect(owner).approve(stakingWithLock.address, ethers.utils.parseEther('1000'));
      // Approve stardust to gemstones contract
      await stardust.connect(owner).approve(atlantisGemstones.address, ethers.utils.parseEther('1000'));
      expect(await stardust.allowance(owner.address, stakingWithLock.address)).to.equal(
        ethers.utils.parseEther('1000')
      );
    });
    it('should not upgrade if insufficient required gemstones', async function () {
      await expect(atlantisGemstones.connect(user1).fuseGemstones(1, 4, 2)).to.be.revertedWith(
        'ERC1155: burn amount exceeds balance'
      );
    });
    it('should not upgrade if insufficient required Stardust', async function () {
      //transfer gemstones to user1
      await atlantisGemstones.connect(owner).safeTransferFrom(owner.address, user1.address, 1, 10, '0x');
      await expect(atlantisGemstones.connect(user1).fuseGemstones(1, 4, 1)).to.be.revertedWith(
        'ERC20: burn amount exceeds balance'
      );
    });
  });
});
