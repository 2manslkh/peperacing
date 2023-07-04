import 'dotenv/config';

import { AddressRegistry } from '../typechain';
import { AtlantisEquipments } from '../typechain/contracts/AtlantisEquipments';
import { AtlantisFaucet } from '../typechain';
import { AtlantisSpaceships } from '../typechain/contracts/AtlantisSpaceships';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { chunkArray } from '../utils/helper';
import { expect } from 'chai';

const { ethers, deployments } = require('hardhat');

let owner: SignerWithAddress;
let user1: SignerWithAddress;

let atlantisSpaceships: AtlantisSpaceships;
let atlantisEquipments: AtlantisEquipments;
let addressRegistry: AddressRegistry;
let BASE_URI = 'ipfs://bafybeifjxfjxjenulf3hnp3ghrbq54po42c7plkm3aw2wkpayz26eogfca/';

describe('AtlantisSpaceships', function () {
  before(async function () {
    // Get Signers
    [owner, user1] = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['Phase1', 'Phase2', 'Mock']);
    atlantisSpaceships = await deployments.get('AtlantisSpaceships', owner);
    atlantisEquipments = await deployments.get('AtlantisEquipments', owner);
    addressRegistry = await deployments.get('AtlantisAddressRegistry', owner);

    // Set stardust cost on AtlantisEquipments
    await atlantisEquipments
      .connect(owner)
      .setStardustCosts([
        ethers.parseEther('250'),
        ethers.parseEther('360'),
        ethers.parseEther('490'),
        ethers.parseEther('640'),
        ethers.parseEther('810'),
      ]);
    // Set gemstones cost on AtlantisEquipments
    await atlantisEquipments.connect(owner).setGemstonesRequired([9, 13, 19, 27, 40]);
    // Set Equipment speeds on AtlantisEquipments
    await atlantisEquipments.connect(owner).setEquipmentSpeeds([5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);

    for (let i = 1; i <= 30; i++) {
      await atlantisEquipments.connect(owner).airdrop(user1.address, i, 1, '0x');

      expect(await atlantisEquipments.totalSupply(i)).to.be.equals(1);
    }
    // Approve spaceships contract for user1 to transfer Equipments
    await atlantisEquipments.connect(user1).setApprovalForAll(atlantisSpaceships.address, true);
    // Generate 3999 random numbers between 0-3
    let randomNumbers = [];
    for (let i = 0; i < 3999; i++) {
      randomNumbers.push(Math.floor(Math.random() * 4));
    }
    // Generate array of numbers 1-4000
    let spaceshipIds = [];
    for (let i = 1; i <= 4000; i++) {
      spaceshipIds.push(i);
    }

    let spaceshipIdsChunked = chunkArray(spaceshipIds, 500);
    let randomNumbersChunked = chunkArray(randomNumbers, 500);

    // // Set rarity with chunked arrays
    // for (let i = 0; i < spaceshipIdsChunked.length; i++) {
    //   await atlantisSpaceships.connect(owner).setSpaceshipRarity(spaceshipIdsChunked[i], randomNumbersChunked[i]);
    // }
  });
  beforeEach(async function () { });

  describe('Constants', function () {
    it('Name is set to AtlantisSpaceships', async function () {
      expect(await atlantisSpaceships.name()).to.be.equals('Atlantis Spaceships');
    });

    it('Symbol is set to SPACESHIPS', async function () {
      expect(await atlantisSpaceships.symbol()).to.be.equals('SPACESHIPS');
    });

    it('Equipments is set', async function () {
      expect(await atlantisSpaceships.addressRegistry()).to.be.equals(addressRegistry.address);
    });

    it('BaseURI is set', async function () {
      expect(await atlantisSpaceships.baseURI()).to.be.equals(BASE_URI);
    });
  });

  describe('Minting', function () {
    beforeEach(async function () { });

    it('should be able to airdrop', async function () {
      // Mint 100 spaceship to random users
      await atlantisSpaceships.connect(owner).airdrop([owner.address, owner.address], [2, 3]);
      // Check that spaceship was minted
      expect(await atlantisSpaceships.totalSupply()).to.be.equals(2);
      // Check that users have the correct amount of spaceships
      expect(await atlantisSpaceships.balanceOf(owner.address)).to.be.equals(2);
    });
  });

  describe('Equipping', function () {
    before(async function () {
      // Mint out all spaceships to owner
      await atlantisSpaceships.connect(owner).airdrop([owner.address], [0]);
      // Transfer id 1 spaceship to user1
      await atlantisSpaceships.connect(owner).transferFrom(owner.address, user1.address, 1);
    });

    it('should be able to equip and get correct speed', async function () {
      // Equip spaceship with Equipment 1
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 1, 2, 3);
      // Get spaceship with id 1
      let spaceship = await atlantisSpaceships.spaceships(1);
      // Check that spaceship has the correct Equipments
      expect(spaceship.fireEquipmentId).to.be.equals(1);
      expect(spaceship.lightningEquipmentId).to.be.equals(2);
      expect(spaceship.steelEquipmentId).to.be.equals(3);
      // Check speed is equal to 15
      expect(await atlantisSpaceships.connect(user1).getSpeed(1)).to.be.equals(
        (spaceship.rarity + 1) * (5 + 5 + 5 + 1)
      );
    });

    it('should be able to unequip', async function () {
      // Equip spaceship with Equipment 1
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 1, 2, 3);
      // Unequip spaceship
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 0, 0, 0);
      // Get spaceship with id 1
      let spaceship = await atlantisSpaceships.spaceships(1);
      // Check that spaceship has the correct Equipments
      expect(spaceship.fireEquipmentId).to.be.equals(0);
      expect(spaceship.lightningEquipmentId).to.be.equals(0);
      expect(spaceship.steelEquipmentId).to.be.equals(0);
      // Check speed is equal to 0
      expect(await atlantisSpaceships.connect(user1).getSpeed(1)).to.be.equals((spaceship.rarity + 1) * 1);

      expect(await atlantisEquipments.balanceOf(user1.address, 1)).to.be.equal(1);
      expect(await atlantisEquipments.balanceOf(user1.address, 2)).to.be.equal(1);
      expect(await atlantisEquipments.balanceOf(user1.address, 3)).to.be.equal(1);
    });

    it('should be able to equip and unequip multiple times', async function () {
      // Before equipping
      console.log('Before equipping');
      // Check metadata
      let metadata = await atlantisSpaceships.connect(user1).tokenURI(1);
      console.log(metadata);
      // Equip spaceship with Equipment 1
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 1, 2, 3);
      // After equipping
      console.log('After equipping');
      // Check metadata
      metadata = await atlantisSpaceships.connect(user1).tokenURI(1);
      console.log(metadata);
      // Unequip spaceship
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 0, 0, 0);
      // Equip spaceship with Equipment 1
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 1, 2, 3);
      // Unequip spaceship
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 0, 0, 0);
      // Get spaceship with id 1
      let spaceship = await atlantisSpaceships.spaceships(1);
      // Check that spaceship has the correct Equipments
      expect(spaceship.fireEquipmentId).to.be.equals(0);
      expect(spaceship.lightningEquipmentId).to.be.equals(0);
      expect(spaceship.steelEquipmentId).to.be.equals(0);
      // Check speed is equal to 0
      expect(await atlantisSpaceships.connect(user1).getSpeed(1)).to.be.equals((spaceship.rarity + 1) * 1);
    });

    it('should be able to equip and unequip multiple times with different Equipments', async function () {
      let spaceship = await atlantisSpaceships.spaceships(1);
      // Equip spaceship with Equipment 1
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 1, 2, 3);
      // Unequip spaceship
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 0, 0, 0);
      // Equip spaceship with Equipment 1
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 4, 5, 6);
      // Check speed is equal to 15
      expect(await atlantisSpaceships.connect(user1).getSpeed(1)).to.be.equals(
        (spaceship.rarity + 1) * (15 + 15 + 15 + 1)
      );
      // Unequip spaceship
      await atlantisSpaceships.connect(user1).modifyEquipment(1, 7, 0, 6);
      // Get spaceship with id 1
      spaceship = await atlantisSpaceships.spaceships(1);
      // Check that spaceship has the correct Equipments
      expect(spaceship.fireEquipmentId).to.be.equals(7);
      expect(spaceship.lightningEquipmentId).to.be.equals(0);
      expect(spaceship.steelEquipmentId).to.be.equals(6);
      console.log(await atlantisSpaceships.tokenURI(1));
      // Check speed is equal to 0
      expect(await atlantisSpaceships.connect(user1).getSpeed(1)).to.be.equals(
        (spaceship.rarity + 1) * (25 + 0 + 15 + 1)
      );
    });

    it('should not be able to equip Equipments that are wrong element', async function () {
      // Try to equip spaceship with Equipment 1
      await expect(atlantisSpaceships.connect(user1).modifyEquipment(1, 2, 0, 0)).to.be.revertedWithCustomError(
        atlantisSpaceships,
        'WrongElement'
      );
    });
  });
});
