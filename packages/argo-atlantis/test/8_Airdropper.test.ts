import 'dotenv/config';

import { Airdropper } from '../typechain/contracts/Airdropper';
import { Gold } from '../typechain/contracts/Gold';
import { MockArgonauts } from './../typechain/contracts/common/MockArgonauts';
import { MockERC1155 } from './../typechain/contracts/common/MockERC1155';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { chunkArray } from '../utils/helper';
import { expect } from 'chai';

const { ethers, deployments } = require('hardhat');

let owner: SignerWithAddress;
let user1: SignerWithAddress;

let erc721: MockArgonauts;
let erc1155: MockERC1155;
let erc20: Gold;
let airdropper: Airdropper;

const TEST_WALLETS = 608;

describe('Airdropper', function () {
  before(async function () {
    // Get Signers
    [owner, user1] = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['Airdropper', 'Mock', 'Gold']);
    airdropper = await ethers.getContract('Airdropper', owner);
    erc20 = await ethers.getContract('Gold', owner);
    erc721 = await ethers.getContract('MockArgonauts', owner);
    erc1155 = await ethers.getContract('MockERC1155', owner);

    // Devmint erc20
    expect(await erc20.balanceOf(owner.address)).to.equal(ethers.utils.parseEther('10000000000')); // TODO: remove in prod: 10 billion gold minted to deployer

    // Devmint erc721
    await erc721.connect(owner).mint(TEST_WALLETS);
    expect(await erc721.balanceOf(owner.address)).to.equal(TEST_WALLETS);

    // Devmint erc1155
    // Dev mint 1 of each equipments
    for (let i = 1; i <= 20; i++) {
      await erc1155.connect(owner).mint(owner.address, i, 1, '0x');
    }
  });

  it('should airdrop ERC20', async function () {
    // Generate 20 addresses
    const addresses = [];
    for (let i = 0; i < TEST_WALLETS; i++) {
      addresses.push(ethers.Wallet.createRandom().address);
    }
    console.log('🚀 | addresses', addresses);

    // Create an array of bignumbers from with value of 10 to 200
    const amounts = Array.from({ length: TEST_WALLETS }, (_, i) => i + 1).map((i) =>
      ethers.utils.parseEther(i.toString())
    );

    // Approve gold to airdropper
    await erc20.connect(owner).approve(airdropper.address, ethers.utils.parseEther('1000000'));

    // Chunk array

    let chunkedAddresses = chunkArray(addresses, 200);
    const chunkedAmounts = chunkArray(amounts, 200);
    // Airdrop gold

    for (let i = 0; i < chunkedAddresses.length; i++) {
      await airdropper.connect(owner).airdropERC20(erc20.address, chunkedAddresses[i], chunkedAmounts[i]);
    }

    // Check balance of each address
    for (let i = 0; i < TEST_WALLETS; i++) {
      let balance = await erc20.balanceOf(addresses[i]);

      expect(balance).to.equal(ethers.utils.parseEther((i + 1).toString()));
    }
  });

  it('should airdrop ERC721', async function () {
    // Generate 20 addresses
    const addresses = [];
    for (let i = 0; i < 20; i++) {
      addresses.push(ethers.Wallet.createRandom().address);
    }

    // Create an array from 1 to 20
    const tokenIds = Array.from({ length: 20 }, (_, i) => i);

    // Approve Mock ERC721 to airdropper
    await erc721.connect(owner).setApprovalForAll(airdropper.address, true);
    // Airdrop Mock ERC721
    await airdropper.connect(owner).airdropERC721(erc721.address, addresses, tokenIds);

    // Check balance of each address
    for (let i = 0; i < 20; i++) {
      let balance = await erc721.balanceOf(addresses[i]);

      expect(balance).to.equal(1);
      expect(await erc721.ownerOf(tokenIds[i])).to.equal(addresses[i]);
    }
  });
  it('should airdrop ERC1155', async function () {
    // Generate 20 addresses
    const addresses = [];

    for (let i = 0; i < 20; i++) {
      addresses.push(ethers.Wallet.createRandom().address);
    }

    // Create an array from 1 to 20
    const tokenIds = Array.from({ length: 20 }, (_, i) => i + 1);

    // Create an array of 1s of length 20
    const amounts = Array.from({ length: 20 }, (_, i) => 1);

    // Approve Mock ERC1155 to airdropper
    await erc1155.connect(owner).setApprovalForAll(airdropper.address, true);
    // Airdrop Mock ERC1155
    await airdropper.connect(owner).airdropERC1155(erc1155.address, addresses, tokenIds, amounts);

    // Check balance of each address
    for (let i = 0; i < 20; i++) {
      let balance = await erc1155.balanceOf(addresses[i], tokenIds[i]);
      expect(balance).to.equal(amounts[i]);
    }
  });
  it('should airdrop ETH');
});
