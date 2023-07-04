import 'dotenv/config';

import {
  ATLANTIS_PLANETS_CAP,
  GEMSTONES_500,
  OTHER_PLANET_TOKEN_ID,
  TOKENS_1_000,
  TOKENS_1_000_000_000,
  TOKENS_500_000_000,
  USER_PLANET_TOKEN_ID,
} from '../utils/constants';
import { BigNumber, BigNumberish } from 'ethers';
import { chunkArray, getGemstoneArray, setupElementArray, setupIdArray, setupOrbitArray } from '../utils/helper';
import { deployments, ethers } from 'hardhat';

import { AtlantisGemstones } from './../typechain/contracts/AtlantisGemstones';
import { AtlantisPlanets } from '../typechain/contracts/AtlantisPlanets';
import { Gold } from './../typechain/contracts/Gold';
import { MockArgonauts } from '../typechain/contracts/common/MockArgonauts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { StakingWithLock } from './../typechain/contracts/StakingWithLock';
import { Stardust } from './../typechain/contracts/Stardust';
import { XARGO } from './../typechain/contracts/common/MockXARGO.sol/XARGO';
import { expect } from 'chai';

const { Buffer } = require('buffer');
let owner: SignerWithAddress;
let user: SignerWithAddress;
let user2: SignerWithAddress;
let atlantisPlanets: AtlantisPlanets;
let atlantisGemstones: AtlantisGemstones;
let argonauts: MockArgonauts;
let xargo: XARGO;
let stardust: Stardust;
let stakingWithLock: StakingWithLock;
let gold: Gold;

// Constants
let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
let BASE_URI: string;
let SIGNER_PK: string = process.env.SIGNER_PK_TESTNET ? process.env.SIGNER_PK_TESTNET : '';
let PUBLIC_MINT_COST: BigNumberish;
let WHITELIST_MINT_COST: BigNumber;
let VIP_MINT_COST: BigNumber;
const idArray = setupIdArray();
let orbitArray = setupOrbitArray(); // 0 - Common, 1 - Uncommon, 2 - Rare, 3 - Epic
const elementArray = setupElementArray(); // 0 - Fire, 1 - Lightning, 2 - Steel

let indexToSplit = idArray.length / 4;

type SignatureAndNonce = {
  signature: string;
  nonce: string;
};

// Signing Function
async function getSignatureAndNonce(userAddress: string, whitelistPhase: BigNumber): Promise<SignatureAndNonce> {
  const wallet = new ethers.Wallet(SIGNER_PK);
  // const nonce = ethers.utils.randomBytes(32);
  const nonce = ethers.constants.AddressZero;
  const msgHash = ethers.utils.solidityKeccak256(
    ['address', 'bytes', 'uint256'],
    [userAddress, nonce, whitelistPhase.toHexString()]
  );
  const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));
  return { signature, nonce: ethers.utils.hexlify(nonce) };
}

/**
 * Phase 2 Fixture
 * - All Planets Minted Out
 * - All Orbits are set
 * - All Elements are set
 * - All Upgrade Requirements are set
 * - 500 of each Gemstones minted to user
 * - 1 Billion XARGO Minted to user
 * - 1 Billion Gold is Staked to StakingWithLock
 * - 1 Billion Stardust Transferred to user (from staking)
 * - Atlantis is approved to AtlantisPlanets
 * - AtlantisGemstones is approved to AtlantisPlanets
 * - Stardust is approved to StakingWithLock
 * - Gold is approved to StakingWithLock
 * - XARGO is approved to AtlantisPlanets
 * - Approve Argonauts to Atlantis as stakable collection
 * - Argonauts is approved to Atlantis
 * - Set to Stage 4
 */
const setupAtlantisPlanetsFixture = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    [owner, user] = await ethers.getSigners();

    await deployments.fixture(['Mock', 'Phase1']);

    atlantisPlanets = await ethers.getContract('MockAtlantisPlanets', owner);
    atlantisGemstones = await ethers.getContract('AtlantisGemstones', owner);
    argonauts = await ethers.getContract('MockArgonauts', owner);
    stardust = await ethers.getContract('Stardust', owner);
    xargo = await ethers.getContract('XARGO', owner);
    stakingWithLock = await ethers.getContract('StakingWithLock', owner);
    gold = await ethers.getContract('Gold', owner);

    // Set Stage to 2
    await atlantisPlanets.setStage(2);

    // Mint Argonaut
    await argonauts.connect(user).mint(1);
    await argonauts.connect(owner).mint(1);

    expect(await argonauts.ownerOf(0)).to.equal(user.address);
    // set public mint price to 0
    await atlantisPlanets.setPublicMintPrice(0);

    // Get mint cost from planets contract
    PUBLIC_MINT_COST = await atlantisPlanets.publicMintPrice();
    // Mint Out All Planets to Owner
    let tx;
    for (let i = 0; i < 20; i += 1) {
      tx = await atlantisPlanets.mint(300, { value: PUBLIC_MINT_COST.mul(300) });
    }

    // Expect atlantisPlanets id 1-12 to be not minted
    for (let i = 1; i <= 12; i += 1) {
      await expect(atlantisPlanets.ownerOf(i)).to.be.revertedWith('ERC721: invalid token ID');
    }
    // Expect atlantisPlanets id 4512 to exist
    expect(await atlantisPlanets.ownerOf(6012)).to.equal(owner.address);
    // Transfer tokenId 1 to user
    await atlantisPlanets.transferFrom(owner.address, user.address, USER_PLANET_TOKEN_ID);

    // Prepare Orbit Data, Element Data, and Level Up Data
    let orbitArrayChunked = chunkArray(orbitArray, 500);
    let elementArrayChunked = chunkArray(elementArray, 500);
    let idArrayChunked = chunkArray(idArray, 500);
    let levelUpGemstone: string = await getGemstoneArray('./data/gemstone_requirements_v2.csv');

    await atlantisPlanets.setStage(3);

    // Set Orbits
    for (let i = 0; i < idArrayChunked.length; i++) {
      await atlantisPlanets.setPlanetOrbits(idArrayChunked[i], orbitArrayChunked[i]);
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

    // Transfer 1 Billion stardust to user
    await stardust.connect(owner).transfer(user.address, TOKENS_1_000_000_000);

    // Approve AtlantisPlanets to AtlantisGemstones from users
    await atlantisGemstones.connect(user).setApprovalForAll(atlantisPlanets.address, true);
    // Approve Stardust to StakingWithLock from user
    await stardust.connect(user).approve(stakingWithLock.address, TOKENS_1_000_000_000);
    // Approve Gold to StakingWithLock from user
    await gold.connect(user).approve(stakingWithLock.address, TOKENS_1_000_000_000);
    // Approve XARGO to AtlantisPlanets from user
    await xargo.connect(user).approve(atlantisPlanets.address, TOKENS_1_000_000_000);

    // Set to Stage 4
    await atlantisPlanets.setStage(4);

    return {
      owner,
      user,
      atlantisPlanets,
      atlantisGemstones,
      argonauts,
      stardust,
      xargo,
      stakingWithLock,
      gold,
    };
  }
);

const setupPreAtlantisPlanetsFixture = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    [owner, user] = await ethers.getSigners();

    await deployments.fixture(['Mock', 'Phase1']);

    atlantisPlanets = await ethers.getContract('MockAtlantisPlanets', owner);
    console.log('atlantisPlanets.address', atlantisPlanets.address);
    atlantisGemstones = await ethers.getContract('AtlantisGemstones', owner);
    argonauts = await ethers.getContract('MockArgonauts', owner);
    stardust = await ethers.getContract('Stardust', owner);
    xargo = await ethers.getContract('XARGO', owner);
    stakingWithLock = await ethers.getContract('StakingWithLock', owner);
    gold = await ethers.getContract('Gold', owner);

    return {
      owner,
      user,
      atlantisPlanets,
      atlantisGemstones,
      argonauts,
      stardust,
      xargo,
      stakingWithLock,
      gold,
    };
  }
);

describe('AtlantisPlanets', function () {
  describe('Constants', function () {
    beforeEach(async function () {
      // Get Signers
      ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
        await setupPreAtlantisPlanetsFixture());

      // Get Constants
      WHITELIST_MINT_COST = await atlantisPlanets.whitelistMintPrice();
      PUBLIC_MINT_COST = await atlantisPlanets.publicMintPrice();
      VIP_MINT_COST = await atlantisPlanets.vipMintPrice();
      BASE_URI = await atlantisPlanets.baseURI();
    });

    it('Name is set to AtlantisPlanets', async function () {
      expect(await atlantisPlanets.name()).to.equal('Atlantis Planets');
    });

    it('Symbol is set to PLANETS', async function () {
      expect(await atlantisPlanets.symbol()).to.equal('PLANETS');
    });

    it('Max Supply is set', async function () {
      expect(await atlantisPlanets.totalMaxSupply()).to.not.equal(0);
    });

    it('Address Registry is set', async function () {
      expect(await atlantisPlanets.addressRegistry()).to.not.equal(ZERO_ADDRESS);
    });

    it('Whitelist Mint Costs XXX CRO', async function () {
      expect(await atlantisPlanets.whitelistMintPrice()).to.equal(WHITELIST_MINT_COST);
    });
    it('Public Mint Costs XXX CRO', async function () {
      expect(await atlantisPlanets.publicMintPrice()).to.equal(PUBLIC_MINT_COST);
    });
  });

  describe('Minting', function () {
    beforeEach(async function () {
      // Get Signers
      ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
        await setupPreAtlantisPlanetsFixture());

      // Get Constants
      WHITELIST_MINT_COST = await atlantisPlanets.whitelistMintPrice();
      PUBLIC_MINT_COST = await atlantisPlanets.publicMintPrice();
      BASE_URI = await atlantisPlanets.baseURI();
    });

    it('should mint', async function () {
      // Set Stage
      await atlantisPlanets.setStage(2);

      let tx = await (await atlantisPlanets.connect(owner).mint(1, { value: PUBLIC_MINT_COST })).wait();

      let txTransferEvents: any = tx.events?.filter((x) => x.event === 'Transfer');
      let tokenIds = txTransferEvents.map((x: any) => x.args.tokenId.toString());

      expect(await atlantisPlanets.balanceOf(owner.address)).to.equal(1);
      expect(await atlantisPlanets.totalSupply()).to.equal(1);
      expect(await atlantisPlanets.ownerOf(tokenIds[0])).to.equal(owner.address);

      // expect(await atlantisPlanets.tokenURI(tokenIds[0])).to.equal(`${BASE_URI}${tokenIds[0]}`);

      // Check Token Starting Data
      let planetData = await atlantisPlanets.planets(tokenIds[0]);
      expect(planetData.level).to.equal(1);
      expect(planetData.element).to.equal(0);
      expect(planetData.orbit).to.equal(0);
      expect(planetData.onExpedition).to.equal(false);
    });
    it('should vipMint', async function () {
      let { nonce, signature } = await getSignatureAndNonce(owner.address, BigNumber.from('1'));

      // Set Stage
      await atlantisPlanets.setStage(1);
      await atlantisPlanets.setWhitelistPhase(1);
      let tx = await (
        await atlantisPlanets.connect(owner).whitelistMint(1, nonce, signature, { value: VIP_MINT_COST })
      ).wait();
      let txTransferEvents: any = tx.events?.filter((x) => x.event === 'Transfer');
      let tokenIds = txTransferEvents.map((x: any) => x.args.tokenId.toString());

      expect(await atlantisPlanets.balanceOf(owner.address)).to.equal(1);
      expect(await atlantisPlanets.totalSupply()).to.equal(1);
      expect(await atlantisPlanets.ownerOf(tokenIds[0])).to.equal(owner.address);
      // expect(await atlantisPlanets.tokenURI(tokenIds[0])).to.equal(`${BASE_URI}${tokenIds[0]}`);
    });
    it('should whitelistMint', async function () {
      let { nonce, signature } = await getSignatureAndNonce(owner.address, BigNumber.from('2'));

      // Set Stage
      await atlantisPlanets.setStage(1);
      await atlantisPlanets.setWhitelistPhase(2);
      let tx = await (
        await atlantisPlanets.connect(owner).whitelistMint(1, nonce, signature, { value: WHITELIST_MINT_COST })
      ).wait();
      let txTransferEvents: any = tx.events?.filter((x) => x.event === 'Transfer');
      let tokenIds = txTransferEvents.map((x: any) => x.args.tokenId.toString());

      expect(await atlantisPlanets.balanceOf(owner.address)).to.equal(1);
      expect(await atlantisPlanets.totalSupply()).to.equal(1);
      expect(await atlantisPlanets.ownerOf(tokenIds[0])).to.equal(owner.address);
      // expect(await atlantisPlanets.tokenURI(tokenIds[0])).to.equal(`${BASE_URI}${tokenIds[0]}`);
    });
    describe('should not whitelistMint if...', async function () {
      beforeEach(async function () {
        // Get Signers
        ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
          await setupPreAtlantisPlanetsFixture());

        let { nonce, signature } = await getSignatureAndNonce(owner.address, BigNumber.from('1'));
        this.nonce = nonce;
        this.signature = signature;
        await atlantisPlanets.setStage(1);
        await atlantisPlanets.setWhitelistPhase(1);
      });

      it('incorrect signature', async function () {
        await expect(
          atlantisPlanets.connect(user).whitelistMint(1, this.nonce, this.signature, { value: WHITELIST_MINT_COST })
        ).to.be.revertedWithCustomError(atlantisPlanets, 'InvalidSignature');
      });
      it('stage is not 1', async function () {
        await atlantisPlanets.setStage(2);
        await expect(
          atlantisPlanets.connect(owner).whitelistMint(1, this.nonce, this.signature, { value: WHITELIST_MINT_COST })
        ).to.be.revertedWithCustomError(atlantisPlanets, 'InvalidStage');
      });
      it('incorrect price', async function () {
        await atlantisPlanets.setStage(1);
        await atlantisPlanets.setWhitelistPhase(2);
        let { nonce, signature } = await getSignatureAndNonce(owner.address, BigNumber.from('2'));
        this.nonce = nonce;
        this.signature = signature;
        await expect(
          atlantisPlanets.connect(owner).whitelistMint(1, this.nonce, this.signature, { value: 0 })
        ).to.be.revertedWithCustomError(atlantisPlanets, 'InsufficientCRO');
      });
      it('exceeded max supply', async function () {
        ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
          await setupAtlantisPlanetsFixture());
        await atlantisPlanets.setStage(1);

        await expect(
          atlantisPlanets.connect(owner).whitelistMint(1, this.nonce, this.signature, { value: WHITELIST_MINT_COST })
        ).to.be.revertedWith('Requested number of tokens not available');
      });
      it('exceeded max supply per wallet', async function () {
        await atlantisPlanets.setStage(1);
        await atlantisPlanets.setWhitelistPhase(2);
        let { nonce, signature } = await getSignatureAndNonce(owner.address, BigNumber.from('2'));
        this.nonce = nonce;
        this.signature = signature;
        await expect(
          atlantisPlanets
            .connect(owner)
            .whitelistMint(21, this.nonce, this.signature, { value: WHITELIST_MINT_COST.mul(21) })
        ).to.be.revertedWithCustomError(atlantisPlanets, 'ExceedMaxMintPerWallet');
      });
    });
    // TODO:
    describe('should not mint if...', async function () {
      beforeEach(async function () {});

      it('stage is not 2', async function () {
        await expect(atlantisPlanets.connect(owner).mint(1, { value: PUBLIC_MINT_COST })).to.be.revertedWithCustomError(
          atlantisPlanets,
          'InvalidStage'
        );
      });
      it('incorrect price', async function () {
        await atlantisPlanets.setStage(2);
        await expect(atlantisPlanets.connect(owner).mint(1, { value: 0 })).to.be.revertedWithCustomError(
          atlantisPlanets,
          'InsufficientCRO'
        );
      });
      it('exceeded max supply', async function () {
        ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
          await setupAtlantisPlanetsFixture());
        await atlantisPlanets.setStage(2);

        await expect(atlantisPlanets.connect(owner).mint(1, { value: PUBLIC_MINT_COST })).to.be.revertedWith(
          'Requested number of tokens not available'
        );
      });
    });
  });

  describe('Upgrading', function () {
    beforeEach(async function () {
      // Load Phase 2 Fixture
      ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
        await setupAtlantisPlanetsFixture());
    });

    it('should get upgrade requirements', async function () {
      // Get details of planet
      let planetData = await atlantisPlanets.planets(USER_PLANET_TOKEN_ID);
      let upgradeCosts = await atlantisPlanets.getUpgradeCosts(USER_PLANET_TOKEN_ID, 1);
      let upgradeRequirements = upgradeCosts[2];

      if (planetData.orbit === 0) {
        expect(upgradeRequirements).deep.equal([10, 0, 0, 0]); // Level 1 -> 2 requires 10 of tier 1 Gemstone
      } else if (planetData.orbit === 1) {
        expect(upgradeRequirements).deep.equal([12, 0, 0, 0]); // Level 1 -> 2 requires 10 of tier 1 Gemstone
      } else if (planetData.orbit === 2) {
        expect(upgradeRequirements).deep.equal([14, 0, 0, 0]); // Level 1 -> 2 requires 10 of tier 1 Gemstone
      } else if (planetData.orbit === 3) {
        expect(upgradeRequirements).deep.equal([16, 0, 0, 0]); // Level 1 -> 2 requires 10 of tier 1 Gemstone
      }

      // level 1 -> 50
      upgradeCosts = await atlantisPlanets.getUpgradeCosts(USER_PLANET_TOKEN_ID, 49);
      upgradeRequirements = upgradeCosts[2];

      if (planetData.orbit === 0) {
        expect(upgradeRequirements).deep.equal([290, 175, 225, 275]);
      } else if (planetData.orbit === 1) {
        expect(upgradeRequirements).deep.equal([348, 210, 270, 330]);
      } else if (planetData.orbit === 2) {
        expect(upgradeRequirements).deep.equal([406, 245, 315, 385]);
      } else if (planetData.orbit === 3) {
        expect(upgradeRequirements).deep.equal([464, 280, 360, 440]);
      }
    });

    // Planet Level must increase
    // Correct amount of Gemstones must be consumed
    // Correct amount of tokens must be consumed
    it('should upgrade planet', async function () {
      let upgradeCosts = await atlantisPlanets.getUpgradeCosts(USER_PLANET_TOKEN_ID, 1);
      let upgradeRequirements = upgradeCosts[2];

      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 1);

      let { level, element, orbit } = await atlantisPlanets.planets(USER_PLANET_TOKEN_ID);

      expect(level).to.equal(2);

      // Check that the correct amount of Gemstones were consumed
      // Get element of planet first

      for (let i = 1; i <= 12; i++) {
        let tier = Math.ceil(i / 3) - 1;

        if ((i - 1) % 3 == element) {
          expect(await atlantisGemstones.balanceOf(user.address, i)).to.equal(
            GEMSTONES_500 - upgradeRequirements[tier]
          );
        } else {
          expect(await atlantisGemstones.balanceOf(user.address, i)).to.equal(GEMSTONES_500);
        }
      }
      let stardustCost = upgradeCosts[0];
      console.log('🚀 | stardustCost', stardustCost.toString());

      // Check that the correct amount of tokens were consumed
      expect(await stardust.balanceOf(user.address)).to.equal(TOKENS_1_000_000_000.sub(stardustCost));
    });

    it('should not upgrade planet if insufficient gemstones', async function () {
      // Transfer out all Gemstones
      for (let i = 1; i <= 12; i++) {
        await atlantisGemstones.connect(user).safeTransferFrom(user.address, owner.address, i, GEMSTONES_500, '0x00');
      }

      await expect(atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 1)).to.be.revertedWith(
        'ERC1155: burn amount exceeds balance'
      );
    });

    it('should not upgrade if max level', async function () {
      // Upgrade to level 50
      await atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 49);
      // Try to upgrade again
      await expect(atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 1)).to.be.revertedWithCustomError(
        atlantisPlanets,
        'ExceededMaxLevel'
      );
    });

    it('should not upgrade if not owner of planet', async function () {
      // Transfer planet to someone else
      await atlantisPlanets.connect(user).transferFrom(user.address, owner.address, USER_PLANET_TOKEN_ID);
      // Try to upgrade
      await expect(atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 1)).to.be.revertedWithCustomError(
        atlantisPlanets,
        'NotOwnerOfPlanet'
      );
    });

    it('should not upgrade planet if insufficient XARGO', async function () {
      // Transfer out all XARGO
      await xargo.connect(user).transfer(owner.address, TOKENS_1_000_000_000);
      // Try to upgrade
      await expect(atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 1)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      );
    });

    it('should not upgrade planet if insufficient Stardust', async function () {
      // Transfer out all Stardust
      await stardust.connect(user).transfer(owner.address, TOKENS_1_000_000_000);
      // Check balance of stardust to be 0
      expect(await stardust.balanceOf(user.address)).to.equal(0);

      // Try to upgrade
      await expect(atlantisPlanets.connect(user).upgradePlanet(USER_PLANET_TOKEN_ID, 1)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      );
    });
  });

  describe('Admin Functions', function () {
    beforeEach(async function () {
      // Get Signers
      ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
        await setupPreAtlantisPlanetsFixture());

      // Get Constants
      WHITELIST_MINT_COST = await atlantisPlanets.whitelistMintPrice();
      PUBLIC_MINT_COST = await atlantisPlanets.publicMintPrice();
      BASE_URI = await atlantisPlanets.baseURI();
    });
    it('Should set orbits', async function () {
      // Set to stage 3
      await atlantisPlanets.setStage(3);
      let orbitArrayChunked = chunkArray(orbitArray, 500);
      let idArrayChunked = chunkArray(idArray, 500);

      // Set Orbits
      for (let i = 0; i < idArrayChunked.length; i++) {
        await (await atlantisPlanets.setPlanetOrbits(idArrayChunked[i], orbitArrayChunked[i])).wait();
      }

      expect((await atlantisPlanets.planets(1)).orbit).to.equal(0);
    });
    it('should set elements', async function () {
      // Set to stage 3
      await atlantisPlanets.setStage(3);
      let elementArrayChunked = chunkArray(elementArray, 500);
      let idArrayChunked = chunkArray(idArray, 500);

      // Set Elements
      for (let i = 0; i < idArrayChunked.length; i++) {
        await (await atlantisPlanets.setPlanetElements(idArrayChunked[i], elementArrayChunked[i])).wait();
      }
      expect((await atlantisPlanets.planets(1)).element).to.equal(0);
    });

    // TODO:
    it('should set background');
    // TODO:
    it('should set orbit names');

    it('should fail setting orbits, elements, and orbit names if not stage 3', async function () {
      // Set to stage 2
      await atlantisPlanets.setStage(2);
      let orbitArrayChunked = chunkArray(orbitArray, 500);
      let idArrayChunked = chunkArray(idArray, 500);

      // Set Orbits
      for (let i = 0; i < idArrayChunked.length; i++) {
        await expect(
          atlantisPlanets.setPlanetOrbits(idArrayChunked[i], orbitArrayChunked[i])
        ).to.be.revertedWithCustomError(atlantisPlanets, 'InvalidStage');
      }

      // Set Elements
      for (let i = 0; i < idArrayChunked.length; i++) {
        await expect(
          atlantisPlanets.setPlanetElements(idArrayChunked[i], orbitArrayChunked[i])
        ).to.be.revertedWithCustomError(atlantisPlanets, 'InvalidStage');
      }
    });
    it('should withdraw xARGO', async function () {
      // mint xargo to user
      await xargo.connect(owner).devMint(TOKENS_1_000_000_000);
      // Transfer xARGO to contract
      await xargo.connect(owner).transfer(atlantisPlanets.address, TOKENS_1_000_000_000);
      // Check balance of xargo to be 1 billion
      expect(await xargo.balanceOf(atlantisPlanets.address)).to.equal(TOKENS_1_000_000_000);
      // Withdraw xargo
      await (await atlantisPlanets.connect(owner).withdrawERC20(xargo.address, TOKENS_1_000_000_000)).wait();
      // Check balance of xargo to be 0
      expect(await xargo.balanceOf(atlantisPlanets.address)).to.equal(0);
    });

    it('should withdraw stardust', async function () {
      // mint stardust to user
      await stardust.connect(owner).devMint(TOKENS_1_000_000_000);
      // Transfer stardust to contract
      await stardust.connect(owner).transfer(atlantisPlanets.address, TOKENS_1_000_000_000);
      // Check balance of stardust to be 1 billion
      expect(await stardust.balanceOf(atlantisPlanets.address)).to.equal(TOKENS_1_000_000_000);
      // Withdraw stardust
      await (await atlantisPlanets.connect(owner).withdrawERC20(stardust.address, TOKENS_1_000_000_000)).wait();
      // Check balance of stardust to be 0
      expect(await stardust.balanceOf(atlantisPlanets.address)).to.equal(0);
    });

    it('should not be able to withdraw xargo if not owner', async function () {
      // mint xargo to user
      await xargo.connect(owner).devMint(TOKENS_1_000_000_000);
      // Transfer xARGO to contract
      await xargo.connect(owner).transfer(atlantisPlanets.address, TOKENS_1_000_000_000);
      // Check balance of xargo to be 1 billion
      expect(await xargo.balanceOf(atlantisPlanets.address)).to.equal(TOKENS_1_000_000_000);
      // Withdraw xargo
      await expect(atlantisPlanets.connect(user).withdrawERC20(xargo.address, TOKENS_1_000_000_000)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('should not be able to withdraw stardust if not owner', async function () {
      // mint stardust to user
      await stardust.connect(owner).devMint(TOKENS_1_000_000_000);
      // Transfer stardust to contract
      await stardust.connect(owner).transfer(atlantisPlanets.address, TOKENS_1_000_000_000);
      // Check balance of stardust to be 1 billion
      expect(await stardust.balanceOf(atlantisPlanets.address)).to.equal(TOKENS_1_000_000_000);
      // Withdraw stardust
      await expect(
        atlantisPlanets.connect(user).withdrawERC20(stardust.address, TOKENS_1_000_000_000)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    describe('if not owner...', async function () {
      it('should not set stage', async function () {
        await expect(atlantisPlanets.connect(user).setStage(3)).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('should not set reveal', async function () {
        await expect(atlantisPlanets.connect(user).toggleReveal()).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should not set whitelistSignatureAddress', async function () {
        await expect(atlantisPlanets.connect(user).setWhitelistSignerAddress(user.address)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should not set whitelistMaxMintPerWallet', async function () {
        await expect(atlantisPlanets.connect(user).setWhitelistMaxMintPerWallet(1)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });

      it('should not set baseURI', async function () {
        await expect(atlantisPlanets.connect(user).setBaseURI('')).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should not set public mint price', async function () {
        await expect(atlantisPlanets.connect(user).setPublicMintPrice(0)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should not set whitelist mint price', async function () {
        await expect(atlantisPlanets.connect(user).setWhitelistMintPrice(0)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should not set registry contract', async function () {
        await expect(atlantisPlanets.connect(user).setAddressRegistry(user.address)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should not set reveal', async function () {
        await expect(atlantisPlanets.connect(user).withdrawFund()).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
      it('should not set treasury', async function () {
        await expect(atlantisPlanets.connect(user).setTreasury(user.address)).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
    });
  });

  describe('Metadata', function () {
    beforeEach(async function () {
      // Get Signers
      ({ owner, user, atlantisPlanets, atlantisGemstones, argonauts, stardust, xargo, stakingWithLock, gold } =
        await setupAtlantisPlanetsFixture());

      // Get Constants
      WHITELIST_MINT_COST = await atlantisPlanets.whitelistMintPrice();
      PUBLIC_MINT_COST = await atlantisPlanets.publicMintPrice();
      BASE_URI = await atlantisPlanets.baseURI();
    });
    it('should display correct metadata for pre and post reveal', async function () {
      let tokenURI = await atlantisPlanets.tokenURI(13);
      console.log('🚀 | tokenURI', tokenURI);

      // TODO: Compare to expected json
      // reveal
      await atlantisPlanets.toggleReveal();

      tokenURI = await atlantisPlanets.tokenURI(13);
      console.log('🚀 | tokenURI', tokenURI);
      // TODO: Compare to expected json
    });

    it('should display correctly formatted json from tokenURI', async function () {
      // Transfer tokenId 13,14,15,16 to user
      await atlantisPlanets.transferFrom(owner.address, user.address, 14);
      await atlantisPlanets.transferFrom(owner.address, user.address, 15);
      await atlantisPlanets.transferFrom(owner.address, user.address, 16);

      for (let i = 1; i <= 12; i++) {
        // Create collection
        await atlantisGemstones.connect(owner).mint(user.address, i, 4000);
      }
      // mint Gemstones

      let tokenURI = await atlantisPlanets.tokenURI(13);
      console.log('🚀 | tokenURI', tokenURI);

      // reveal
      await atlantisPlanets.toggleReveal();

      tokenURI = await atlantisPlanets.tokenURI(13);
      console.log('🚀 | tokenURI', tokenURI);

      // Upgrade planet 2 to level 20

      await atlantisPlanets.connect(user).upgradePlanet(13, 20);
      // Get URI
      tokenURI = await atlantisPlanets.tokenURI(13);

      // First, extract the base64-encoded string from the encoded string
      let base64EncodedString = tokenURI.split(';base64,')[1];

      // Then, decode the base64-encoded string
      let decodedString = Buffer.from(base64EncodedString, 'base64').toString();

      expect(() => JSON.parse(decodedString)).to.not.throw();

      // Upgrade planet 3 to level 30

      await atlantisPlanets.connect(user).upgradePlanet(14, 30);
      tokenURI = await atlantisPlanets.tokenURI(14);
      // First, extract the base64-encoded string from the encoded string
      base64EncodedString = tokenURI.split(';base64,')[1];

      // Then, decode the base64-encoded string
      decodedString = Buffer.from(base64EncodedString, 'base64').toString();

      expect(() => JSON.parse(decodedString)).to.not.throw();

      // Upgrade planet 4 to level 40

      await atlantisPlanets.connect(user).upgradePlanet(15, 40);
      tokenURI = await atlantisPlanets.tokenURI(15);
      // First, extract the base64-encoded string from the encoded string
      base64EncodedString = tokenURI.split(';base64,')[1];

      // Then, decode the base64-encoded string
      decodedString = Buffer.from(base64EncodedString, 'base64').toString();

      expect(() => JSON.parse(decodedString)).to.not.throw();

      // Upgrade planet 5 to level 50
      console.log('Upgrading planet 16 to level 50');
      console.log('Planet 16 tokenURI: ', await atlantisPlanets.tokenURI(16));
      await atlantisPlanets.connect(user).upgradePlanet(16, 49);
      // Log PlanetUpgraded event and check that it is correct
      const planetUpgradedEvent = await atlantisPlanets.queryFilter(atlantisPlanets.filters.PlanetUpgraded());
      //loop through all events and log args
      planetUpgradedEvent.forEach((log) => {
        console.log('PlanetUpgraded event: ', log.args);
      });

      tokenURI = await atlantisPlanets.tokenURI(16);
      // First, extract the base64-encoded string from the encoded string
      base64EncodedString = tokenURI.split(';base64,')[1];

      // Then, decode the base64-encoded string
      decodedString = Buffer.from(base64EncodedString, 'base64').toString();

      expect(() => JSON.parse(decodedString)).to.not.throw();
    });
  });
});
