import 'dotenv/config';

import { BigNumber, Wallet } from 'ethers';
import { TOKENS_1_000, TOKENS_1_000_000_000 } from '../utils/constants';

import { AddressRegistry } from './../typechain/contracts/common/AddressRegistry';
import { AtlantisEquipments } from '../typechain/contracts/AtlantisEquipments';
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

let atlantisEquipments: AtlantisEquipments;
let atlantisGemstones: AtlantisGemstones;
let argonauts: MockArgonauts;
let stardust: Stardust;
let stakingWithLock: StakingWithLock;
let addressRegistry: AddressRegistry;
let gold: Gold;
// Constants
let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
let BASE_URI = 'ipfs://hash_for_equipments/';

describe('AtlantisEquipments', function () {
  beforeEach(async function () {
    // Get Signers
    [owner, user1] = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['Phase2', 'Mock', 'Phase1']);
    atlantisEquipments = await deployments.get('AtlantisEquipments', owner);
    atlantisGemstones = await deployments.get('AtlantisGemstones', owner);
    stardust = await deployments.get('Stardust', owner);
    stakingWithLock = await deployments.get('StakingWithLock', owner);
    addressRegistry = await deployments.get('AtlantisAddressRegistry', owner);
    gold = await deployments.get('Gold', owner);

    /** Token Ids
     * 1  2  3 Fire Lightning Steel Equipment Level 1
     * 4  5  6 Fire Lightning Steel Equipment Level 2
     * 7  8  9 Fire Lightning Steel Equipment Level 3
     * 10 11 12 Fire Lightning Steel Equipment Level 4
     * 13 14 15 Fire Lightning Steel Equipment Level 5
     * 16 17 18 Fire Lightning Steel Equipment Level 6
     * 19 20 21 Fire Lightning Steel Equipment Level 7
     * 22 23 24 Fire Lightning Steel Equipment Level 8
     * 25 26 27 Fire Lightning Steel Equipment Level 9
     * 28 29 30 Fire Lightning Steel Equipment Level 10
     *
     * stardustCost[0] =  250
     * stardustCost[1] =  360
     * stardustCost[2] =  490
     * stardustCost[3] =  640
     * stardustCost[4] =  810
     *
     * GemstonesCost[0] =  9
     * GemstonesCost[1] =  13
     * GemstonesCost[2] =  19
     * GemstonesCost[3] =  27
     * GemstonesCost[4] =  40
     */
    // Set stardust cost on AtlantisEquipments
    // await atlantisEquipments
    //   .connect(owner)
    //   .setStardustCosts([
    //     ethers.parseEther('250'),
    //     ethers.parseEther('360'),
    //     ethers.parseEther('490'),
    //     ethers.parseEther('640'),
    //     ethers.parseEther('810'),
    //   ]);
    // // Set Gemstones cost on AtlantisEquipments
    // await atlantisEquipments.connect(owner).setGemstonesRequired([9, 13, 19, 27, 40]);
    // // Set Equipment speeds on AtlantisEquipments
    // await atlantisEquipments.connect(owner).setEquipmentSpeeds([5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);

    for (let i = 1; i <= 30; i++) {
      await atlantisEquipments.airdrop(owner.address, i, 1, '0x');

      expect(await atlantisEquipments.totalSupply(i)).to.be.equals(1);
    }
  });

  describe('Constants', function () {
    it('Name is set to AtlantisEquipments', async function () {
      expect(await atlantisEquipments.name()).to.be.equals('Atlantis Equipment');
    });

    it('Symbol is set to AE', async function () {
      expect(await atlantisEquipments.symbol()).to.be.equals('EQUIPMENT');
    });

    it('Address Registry is set', async function () {
      expect(await atlantisEquipments.addressRegistry()).to.be.equals(addressRegistry.address);
    });
  });

  // describe('Withdraw Fund', function () {
  //   beforeEach(async function () {
  //     // TODO: Test
  //     // Send 1000 ether to AtlantisEquipments
  //     await owner.sendTransaction({
  //       to: atlantisEquipments.address,
  //       value: ethers.parseEther('1000'),
  //     });
  //   });

  //   it('should withdraw funds to treasury', async function () {
  //     let balanceBefore = await ethers.provider.getBalance(owner.address);
  //     let gas = await atlantisEquipments.connect(owner).estimateGas.withdrawFund();
  //     await atlantisEquipments.connect(owner).withdrawFund();
  //     let balanceAfter = await ethers.provider.getBalance(owner.address);
  //     expect(await ethers.provider.getBalance(atlantisEquipments.address)).to.be.equals(0);
  //     expect(balanceAfter.sub(balanceBefore)).to.be.greaterThan(ethers.parseEther('999'));
  //   });
  // });

  describe('Minting', function () {
    beforeEach(async function () { });

    it('should be able to mint random tokenid from 1-3', async function () {
      // mint 100 times
      await atlantisEquipments.connect(owner).mint(user1.address, 1, { value: ethers.parseEther('30') });

      // Add up balance of tokenIds 1-3 and check if it is 1
      let balance = BigNumber.from(0);
      for (let i = 1; i <= 3; i++) {
        balance = balance.add(await atlantisEquipments.balanceOf(user1.address, i));
      }
      expect(balance).to.be.equals(1);
    });

    it('should be able to batchMint', async function () {
      // mint 100 times
      await atlantisEquipments.connect(owner).batchMint(user1.address, [1, 2, 3], [10, 10, 10], '0x');

      // Add up balance of tokenIds 1-3 and check if it is 30
      let balance = BigNumber.from(0);
      for (let i = 1; i <= 3; i++) {
        balance = balance.add(await atlantisEquipments.balanceOf(user1.address, i));
      }
      expect(balance).to.be.equals(30);
    });
  });

  describe('Equipment speeds', function () {
    it('should be able to get correct Equipment speeds according to Equipment tier', async function () {
      let speeds = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
      // Check that fire Equipment speed is correct
      let j = 0;
      for (let i = 1; i <= 30; i += 3) {
        console.log('Equipment id:', i);
        // log metadata
        console.log('Equipment metadata:', await atlantisEquipments.uri(i));
        expect(await atlantisEquipments.getSpeed(i)).to.be.equals(speeds[j]);
        j++;
      }
    });
  });

  describe('Upgrading', function () {
    beforeEach(async function () {
      // Dev Mint 50 of each Equipments
      for (let i = 1; i <= 30; i++) {
        await atlantisEquipments.connect(owner).airdrop(user1.address, i, 50, '0x');
      }
      // Check that user1 has 50 of each tier 4 Gemstone
      for (let i = 10; i <= 12; i++) {
        await atlantisGemstones.connect(owner).mint(user1.address, i, 50);
        expect(await atlantisGemstones.balanceOf(user1.address, i)).to.be.equals(50);
      }
      // Dev Mint Stardust Tokens
      await stardust.connect(user1).devMint(ethers.parseEther('1000000'));
      expect(await stardust.balanceOf(user1.address)).to.equal(ethers.parseEther('1000000'));

      // Approve Stardust to approve
      await stardust.connect(user1).approve(atlantisEquipments.address, ethers.parseEther('1000000000'));
      expect(await stardust.allowance(user1.address, atlantisEquipments.address)).to.equal(
        ethers.parseEther('1000000000')
      );
      // Approve Stardust to approve
      await stardust.connect(user1).approve(stakingWithLock.address, ethers.parseEther('1000000000'));
      await stardust.connect(user1).approve(atlantisEquipments.address, ethers.parseEther('1000000000'));
      expect(await stardust.allowance(user1.address, stakingWithLock.address)).to.equal(
        ethers.parseEther('1000000000')
      );
      // Mint gold to user1
      await gold.connect(user1).devMint(ethers.parseEther('1000000'));
      // Stake gold in stakingwithLOck
      await gold.connect(user1).approve(stakingWithLock.address, ethers.parseEther('1000000000'));
      await stakingWithLock.connect(user1).stake(ethers.parseEther('1000000'));
    });

    // Gemstones Should be consumed
    // Upgraded Gemstones Should be minted to user
    // Stardust Tokens should be consumed
    it('should upgrade Equipment from tier 1 to tier 2', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get Gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get Gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get Gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);

      await atlantisEquipments.connect(user1).fuseEquipment(1, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(2, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(3, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 1)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 2)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 3)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 4)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 5)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 6)).to.be.equals(51);
      // Expect no change in stardust balance
      expect(await stardust.balanceOf(user1.address)).to.equal(stardustBalanceBefore);
      // Expect no change in gemstones balance
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore);
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2);
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3);
    });
    it('should upgrade Equipment from tier 2 to tier 3', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get Gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get Gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      await atlantisEquipments.connect(user1).fuseEquipment(4, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(5, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(6, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 4)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 5)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 6)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 7)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 8)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 9)).to.be.equals(51);
      // Expect no change in stardust balance
      expect(await stardust.balanceOf(user1.address)).to.equal(stardustBalanceBefore);
      // Expect no change in gemstones balance
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore);
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2);
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3);
    });
    it('should upgrade Equipment from tier 3 to tier 4', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      await atlantisEquipments.connect(user1).fuseEquipment(7, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(8, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(9, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 7)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 8)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 9)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 10)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 11)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 12)).to.be.equals(51);
      // Expect no change in stardust balance
      expect(await stardust.balanceOf(user1.address)).to.equal(stardustBalanceBefore);
      // Expect no change in gemstones balance
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore);
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2);
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3);
    });
    it('should upgrade Equipment from tier 4 to tier 5', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      await atlantisEquipments.connect(user1).fuseEquipment(10, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(11, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(12, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 10)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 11)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 12)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 13)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 14)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 15)).to.be.equals(51);
      // Expect no change in stardust balance
      expect(await stardust.balanceOf(user1.address)).to.equal(stardustBalanceBefore);
      // Expect no change in gemstones balance
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore);
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2);
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3);
    });
    it('should upgrade Equipment from tier 5 to tier 6', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      // Calculate fusion cost
      let fusionCost1 = await atlantisEquipments.calculateFusionCost(13, 1);
      let fusionCost2 = await atlantisEquipments.calculateFusionCost(14, 1);
      let fusionCost3 = await atlantisEquipments.calculateFusionCost(15, 1);
      // expect fusion cost to be 250 ether
      expect(fusionCost1).to.be.equals(ethers.parseEther('250'));
      expect(fusionCost2).to.be.equals(ethers.parseEther('250'));
      expect(fusionCost3).to.be.equals(ethers.parseEther('250'));
      await atlantisEquipments.connect(user1).fuseEquipment(13, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(14, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(15, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 13)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 14)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 15)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 16)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 17)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 18)).to.be.equals(51);

      // Expect user to have 750 lesser stardust than before
      expect(await stardust.balanceOf(user1.address)).to.be.equals(
        stardustBalanceBefore.sub(ethers.parseEther('750'))
      );
      // Expect user to have 9 less gemstones than before
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore.sub(9));
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2.sub(9));
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3.sub(9));
    });
    it('should upgrade Equipment from tier 6 to tier 7', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      // Calculate fusion cost
      let fusionCost1 = await atlantisEquipments.calculateFusionCost(16, 1);
      let fusionCost2 = await atlantisEquipments.calculateFusionCost(17, 1);
      let fusionCost3 = await atlantisEquipments.calculateFusionCost(18, 1);
      // expect fusion cost to be 250 ether
      expect(fusionCost1).to.be.equals(ethers.parseEther('360'));
      expect(fusionCost2).to.be.equals(ethers.parseEther('360'));
      expect(fusionCost3).to.be.equals(ethers.parseEther('360'));
      await atlantisEquipments.connect(user1).fuseEquipment(16, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(17, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(18, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 16)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 17)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 18)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 19)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 20)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 21)).to.be.equals(51);

      // Expect user to have 360*3 lesser stardust than before
      expect(await stardust.balanceOf(user1.address)).to.be.equals(
        stardustBalanceBefore.sub(ethers.parseEther('1080'))
      );
      // Expect user to have 9 less gemstones than before
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore.sub(13));
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2.sub(13));
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3.sub(13));
    });
    it('should upgrade Equipment from tier 7 to tier 8', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      // Calculate fusion cost
      let fusionCost1 = await atlantisEquipments.calculateFusionCost(19, 1);
      let fusionCost2 = await atlantisEquipments.calculateFusionCost(20, 1);
      let fusionCost3 = await atlantisEquipments.calculateFusionCost(21, 1);
      // expect fusion cost to be 250 ether
      expect(fusionCost1).to.be.equals(ethers.parseEther('490'));
      expect(fusionCost2).to.be.equals(ethers.parseEther('490'));
      expect(fusionCost3).to.be.equals(ethers.parseEther('490'));
      await atlantisEquipments.connect(user1).fuseEquipment(19, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(20, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(21, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 19)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 20)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 21)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 22)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 23)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 24)).to.be.equals(51);

      // Expect user to have 490*3 lesser stardust than before
      expect(await stardust.balanceOf(user1.address)).to.be.equals(
        stardustBalanceBefore.sub(ethers.parseEther('1470'))
      );
      // Expect user to have 19 less gemstones than before
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore.sub(19));
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2.sub(19));
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3.sub(19));
    });
    it('should upgrade Equipment from tier 8 to tier 9', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      // Calculate fusion cost
      let fusionCost1 = await atlantisEquipments.calculateFusionCost(22, 1);
      let fusionCost2 = await atlantisEquipments.calculateFusionCost(23, 1);
      let fusionCost3 = await atlantisEquipments.calculateFusionCost(24, 1);
      // expect fusion cost to be 250 ether
      expect(fusionCost1).to.be.equals(ethers.parseEther('640'));
      expect(fusionCost2).to.be.equals(ethers.parseEther('640'));
      expect(fusionCost3).to.be.equals(ethers.parseEther('640'));
      await atlantisEquipments.connect(user1).fuseEquipment(22, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(23, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(24, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 22)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 23)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 24)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 25)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 26)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 27)).to.be.equals(51);

      // Expect user to have 640*3 lesser stardust than before
      expect(await stardust.balanceOf(user1.address)).to.be.equals(
        stardustBalanceBefore.sub(ethers.parseEther('1920'))
      );
      // Expect user to have 27 less gemstones than before
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore.sub(27));
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2.sub(27));
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3.sub(27));
    });
    it('should upgrade Equipment from tier 9 to tier 10', async function () {
      // Get stardust balance before upgrade
      const stardustBalanceBefore = await stardust.balanceOf(user1.address);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore = await atlantisGemstones.balanceOf(user1.address, 10);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore2 = await atlantisGemstones.balanceOf(user1.address, 11);
      // Get gemstones balance for id 10,11,12 before upgrade
      const gemstonesBalanceBefore3 = await atlantisGemstones.balanceOf(user1.address, 12);
      // Calculate fusion cost
      let fusionCost1 = await atlantisEquipments.calculateFusionCost(25, 1);
      let fusionCost2 = await atlantisEquipments.calculateFusionCost(26, 1);
      let fusionCost3 = await atlantisEquipments.calculateFusionCost(27, 1);
      // expect fusion cost to be 250 ether
      expect(fusionCost1).to.be.equals(ethers.parseEther('810'));
      expect(fusionCost2).to.be.equals(ethers.parseEther('810'));
      expect(fusionCost3).to.be.equals(ethers.parseEther('810'));
      await atlantisEquipments.connect(user1).fuseEquipment(25, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(26, 1);
      await atlantisEquipments.connect(user1).fuseEquipment(27, 1);
      // Expect user to have 49 tier 1 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 25)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 26)).to.be.equals(48);
      expect(await atlantisEquipments.balanceOf(user1.address, 27)).to.be.equals(48);
      // Expect user to have 1 tier 2 Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 28)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 29)).to.be.equals(51);
      expect(await atlantisEquipments.balanceOf(user1.address, 30)).to.be.equals(51);

      // Expect user to have 810*3 lesser stardust than before
      expect(await stardust.balanceOf(user1.address)).to.be.equals(
        stardustBalanceBefore.sub(ethers.parseEther('2430'))
      );

      // Expect user to have 40 less gemstones than before
      expect(await atlantisGemstones.balanceOf(user1.address, 10)).to.equal(gemstonesBalanceBefore.sub(40));
      expect(await atlantisGemstones.balanceOf(user1.address, 11)).to.equal(gemstonesBalanceBefore2.sub(40));
      expect(await atlantisGemstones.balanceOf(user1.address, 12)).to.equal(gemstonesBalanceBefore3.sub(40));
    });
    it('should not be able to upgrade Equipment when its tier 10', async function () {
      // Get user stardust balance
      let balance = await stardust.balanceOf(user1.address);
      // expect to be reverted with upgradeerror
      await expect(atlantisEquipments.connect(user1).calculateFusionCost(28, 1)).to.be.revertedWithCustomError(
        atlantisEquipments,
        'UpgradeError'
      );
      await expect(atlantisEquipments.connect(user1).calculateFusionCost(29, 1)).to.be.revertedWithCustomError(
        atlantisEquipments,
        'UpgradeError'
      );
      await expect(atlantisEquipments.connect(user1).calculateFusionCost(30, 1)).to.be.revertedWithCustomError(
        atlantisEquipments,
        'UpgradeError'
      );
      await expect(atlantisEquipments.connect(user1).fuseEquipment(28, 1)).to.be.revertedWithCustomError(
        atlantisEquipments,
        'UpgradeError'
      );
      await expect(atlantisEquipments.connect(user1).fuseEquipment(29, 1)).to.be.revertedWithCustomError(
        atlantisEquipments,
        'UpgradeError'
      );
      await expect(atlantisEquipments.connect(user1).fuseEquipment(30, 1)).to.be.revertedWithCustomError(
        atlantisEquipments,
        'UpgradeError'
      );
      // Expect user to have no change in Equipments
      expect(await atlantisEquipments.balanceOf(user1.address, 28)).to.be.equals(50);
      expect(await atlantisEquipments.balanceOf(user1.address, 29)).to.be.equals(50);
      expect(await atlantisEquipments.balanceOf(user1.address, 30)).to.be.equals(50);

      expect(await stardust.balanceOf(user1.address)).to.be.equals(balance);
    });

    describe('Upgrading (Negative Tests)', function () {
      beforeEach(async function () {
        // Check that user1 has 50 of each tier 4 gemstone
        for (let i = 10; i <= 12; i++) {
          await atlantisGemstones.connect(owner).mint(owner.address, i, 1000000);
        }
        await atlantisEquipments.connect(owner).airdrop(owner.address, 14, 700, '0x');
      });
      it('should not upgrade if insufficient required gemstones', async function () {
        // Check total supply of tier 4 gemstones
        expect(await atlantisGemstones.totalSupply(10)).to.be.equals(1000050);
        expect(await atlantisGemstones.totalSupply(11)).to.be.equals(1000050);
        expect(await atlantisGemstones.totalSupply(12)).to.be.equals(1000050);
        await expect(atlantisEquipments.connect(user1).fuseEquipment(14, 40)).to.be.revertedWith(
          'ERC1155: burn amount exceeds balance'
        );
      });
      it('should not upgrade if insufficient required Stardust', async function () {
        for (let i = 10; i <= 12; i++) {
          await atlantisGemstones.connect(owner).mint(user1.address, i, 10000);
        }
        // Mint Equipments of id 14
        await atlantisEquipments.connect(owner).airdrop(user1.address, 14, 700, '0x');
        let balance = stardust.balanceOf(user1.address);
        // Transfer all stardust from user1 to owner
        await stardust.connect(user1).transfer(owner.address, balance);
        await expect(atlantisEquipments.connect(user1).fuseEquipment(14, 300)).to.be.revertedWith(
          'ERC20: transfer amount exceeds balance'
        );
      });
    });
  });
});
