import 'dotenv/config';

import {
  AtlantisEquipments,
  AtlantisFaucet,
  AtlantisGemstones,
  AtlantisMarketplace,
  AtlantisPlanets,
  AtlantisSpaceships,
} from '../typechain';

import { Airdropper } from '../typechain/contracts/Airdropper';
import { Gold } from '../typechain/contracts/Gold';
import { MockArgonauts } from '../typechain/contracts/common/MockArgonauts';
import { MockERC1155 } from '../typechain/contracts/common/MockERC1155';
import { MockWCRO } from './../typechain/contracts/common/MockWCRO';
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
let marketplace: AtlantisMarketplace;
let wcro: MockWCRO;

let faucet: AtlantisFaucet;

const TEST_WALLETS = 608;

describe('Faucet', function () {
  before(async function () {
    // Get Signers
    [owner, user1] = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['AtlantisAddressRegistry', 'Phase1', 'Phase2', 'Mock', 'AtlantisFaucet', 'Marketplace']);
    faucet = await deployments.get('AtlantisFaucet', owner);
    planets = await deployments.get('MockAtlantisPlanets', owner);
    equipments = await deployments.get('AtlantisEquipments', owner);
    argonauts = await deployments.get('MockArgonauts', owner);
    gemstones = await deployments.get('AtlantisGemstones', owner);
    spaceships = await deployments.get('AtlantisSpaceships', owner);
    marketplace = await deployments.get('AtlantisMarketplace', owner);
    wcro = await deployments.get('MockWCRO', owner);
  });

  it('should list on marketplace', async function () {
    // // transfer 100 eth to faucet
    // await (await owner.sendTransaction({ to: faucet.address, value: ethers.parseEther('100') })).wait();
    // // whitelist owner to faucet
    // await (await faucet.whitelistAddresses([owner.address])).wait();
    // await (await faucet.drip()).wait();

    await (await argonauts.mint(20)).wait();

    //approve argonaut to marketplace
    await (await argonauts.setApprovalForAll(marketplace.address, true)).wait();
    // list on marketplace
    console.log('argonauts.address', argonauts.address);
    console.log('wcro', wcro.address);
    expect(wcro.address).to.equal(await marketplace.getPaymentTokenForCollection(argonauts.address));
    await marketplace.createOrUpdateListing(
      argonauts.address,
      1,
      1,
      ethers.parseEther('100'),
      1710676010,
      wcro.address
    );
  });
});
