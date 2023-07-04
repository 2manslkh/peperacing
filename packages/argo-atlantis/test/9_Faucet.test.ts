import 'dotenv/config';

import {
  AtlantisEquipments,
  AtlantisFaucet,
  AtlantisGemstones,
  AtlantisPlanets,
  AtlantisSpaceships,
} from '../typechain';

import { Airdropper } from '../typechain/contracts/Airdropper';
import { Gold } from '../typechain/contracts/Gold';
import { MockArgonauts } from '../typechain/contracts/common/MockArgonauts';
import { MockERC1155 } from '../typechain/contracts/common/MockERC1155';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { chunkArray } from '../utils/helper';
import { expect } from 'chai';

const { ethers, deployments } = require('hardhat');

let owner: SignerWithAddress;
let user1: SignerWithAddress;

let argonauts: MockArgonauts;
let planets: AtlantisPlanets;
let equipments: AtlantisEquipments;
let gemstones: AtlantisGemstones;
let spaceships: AtlantisSpaceships;

let faucet: AtlantisFaucet;

const TEST_WALLETS = 608;

describe('Faucet', function () {
  before(async function () {
    // Get Signers
    [owner, user1] = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['AtlantisAddressRegistry', 'Phase1', 'Phase2', 'Mock', 'AtlantisFaucet']);
    faucet = await deployments.get('AtlantisFaucet', owner);
    planets = await deployments.get('MockAtlantisPlanets', owner);
    equipments = await deployments.get('AtlantisEquipments', owner);
    argonauts = await deployments.get('MockArgonauts', owner);
    gemstones = await deployments.get('AtlantisGemstones', owner);
    spaceships = await deployments.get('AtlantisSpaceships', owner);
  });

  it('should drip', async function () {
    await (await faucet.drip()).wait();

    expect(await argonauts.balanceOf(owner.address)).to.equal(1);
    for (let i = 1; i <= 30; i++) {
      expect(await equipments.balanceOf(owner.address, i)).to.equal(3);
    }
    for (let i = 1; i <= 12; i++) {
      expect(await gemstones.balanceOf(owner.address, i)).to.equal(3);
    }
    expect(await spaceships.balanceOf(owner.address)).to.equal(4);
    let common = await spaceships.spaceships(1);
    expect(common.rarity).to.equal(0);
    let uncommon = await spaceships.spaceships(2);
    expect(uncommon.rarity).to.equal(1);
    let rare = await spaceships.spaceships(3);
    expect(rare.rarity).to.equal(2);
    let epic = await spaceships.spaceships(4);
    expect(epic.rarity).to.equal(3);
    console.log('🚀 | await planets.balanceOf(owner.address)', await planets.totalSupply());
    expect(await planets.balanceOf(owner.address)).to.equal(1);
  });
});
