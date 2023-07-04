import { AtlanteanTrove, MockArgoPetz, MockERC1155, MockERC20 } from '../typechain';

import { BigNumber } from 'ethers';
import { expect } from 'chai';

const { ethers, deployments } = require('hardhat');

describe('AtlanteanTrove', () => {
  let trove: AtlanteanTrove;
  let erc721: MockArgoPetz;
  let erc1155: MockERC1155;
  let erc20: MockERC20;
  let erc721_2: MockArgoPetz;
  let erc1155_2: MockERC1155;
  let erc20_2: MockERC20;
  let owner: any;
  let user1: any;
  let user2: any;
  let users: any;
  let SIGNER_PK: string = process.env.SIGNER_PK_TESTNET ? process.env.SIGNER_PK_TESTNET : '';
  type SignatureAndNonce = {
    signature: string;
    nonce: string;
  };

  // Signing Function
  // async function getSignatureAndNonce(userAddress: string, round: BigNumber): Promise<SignatureAndNonce> {
  //   const wallet = new ethers.Wallet(SIGNER_PK);
  //   const nonce = ethers.utils.randomBytes(32);
  //   const message = ethers.utils.defaultAbiCoder.encode(['address', 'bytes', 'uint256'], [userAddress, nonce, round]);
  //   const msgHash = ethers.utils.hashMessage(message);
  //   const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));
  //   let address = ethers.utils.verifyMessage(ethers.utils.arrayify(msgHash), signature);

  //   return { signature, nonce: ethers.utils.hexlify(nonce) };
  // }

  async function getSignatureAndNonce(userAddress: string, round: BigNumber): Promise<SignatureAndNonce> {
    const wallet = new ethers.Wallet(SIGNER_PK);
    const nonce = ethers.utils.randomBytes(32);
    const msgHash = ethers.utils.solidityKeccak256(
      ['address', 'bytes', 'uint256'],
      [userAddress, nonce, BigNumber.from(round).toHexString()]
    );
    const signature = await wallet.signMessage(ethers.utils.arrayify(msgHash));
    return { signature, nonce: ethers.utils.hexlify(nonce) };
  }

  before(async () => {
    // Get signers
    users = await ethers.getSigners();
    [owner, user1, user2] = users;

    await deployments.fixture(['AtlanteanTrove', 'MockArgoPetz', 'Mock']);
    // Get contract factories
    const TroveFactory = await deployments.getFactory('AtlanteanTrove', owner);
    const MockERC1155Factory = await deployments.getFactory('MockERC1155', owner);
    const MockERC20Factory = await deployments.getFactory('MockERC20', owner);
    const MockArgoPetzFactory = await deployments.getFactory('MockArgoPetz', owner);

    // Get deployed contracts
    const troveDeployment = await deployments.get('AtlanteanTrove');
    const mockERC1155Deployment = await deployments.get('MockERC1155');
    const mockERC20Deployment = await deployments.get('MockERC20');
    const mockArgoPetzDeployment = await deployments.get('MockArgoPetz');

    // Attach contracts
    trove = TroveFactory.attach(troveDeployment.address);
    erc1155 = MockERC1155Factory.attach(mockERC1155Deployment.address);
    erc20 = MockERC20Factory.attach(mockERC20Deployment.address);
    erc721 = MockArgoPetzFactory.attach(mockArgoPetzDeployment.address);

    // Deploy a second ERC721 contract
    const MockArgoPetzFactory2 = await deployments.getFactory('MockArgoPetz', owner);
    const mockArgoPetzDeployment2 = await MockArgoPetzFactory2.deploy();

    // Attach second ERC721 contract
    erc721_2 = MockArgoPetzFactory2.attach(mockArgoPetzDeployment2.address);
    // Deploy a second ERC20 contract
    const MockERC20Factory2 = await deployments.getFactory('MockERC20', owner);
    const mockERC20Deployment2 = await MockERC20Factory2.deploy();

    // Attach second ERC20 contract
    erc20_2 = MockERC20Factory2.attach(mockERC20Deployment2.address);

    // Deploy a second ERC1155 contract
    const MockERC1155Factory2 = await deployments.getFactory('MockERC1155', owner);
    const mockERC1155Deployment2 = await MockERC1155Factory2.deploy();

    // Attach second ERC1155 contract
    erc1155_2 = MockERC1155Factory2.attach(mockERC1155Deployment2.address);

    // Mint to owner MockERC1155, MockERC20 and MockArgoPetz

    // Mint 1000 of Id 1-12 ERC1155 to owner
    for (let i = 1; i <= 12; i++) {
      await erc1155.connect(owner).mint(owner.address, i, 1000, '0x');
      await erc1155_2.connect(owner).mint(owner.address, i, 1000, '0x');
    }

    // Mint 100 of ERC721
    await erc721.connect(owner).mint(100);
    await erc721_2.connect(owner).mint(100);

    // Mint 100000 of ERC20 to owner
    await erc20.connect(owner).devMint(ethers.parseEther('10000000000'));
    await erc20_2.connect(owner).devMint(ethers.parseEther('10000000000'));

    // Get current block timestamp
    const timestamp = (await ethers.provider.getBlock('latest')).timestamp;

    // Start new round
    await trove.connect(owner).startNewRound(timestamp + 1000, timestamp + 3000);

    // Approve erc20 to trove
    await erc20.connect(owner).approve(trove.address, ethers.parseEther('1000000000000'));
    await erc20_2.connect(owner).approve(trove.address, ethers.parseEther('1000000000000'));

    // Approve erc721 to trove
    await erc721.connect(owner).setApprovalForAll(trove.address, true);
    await erc721_2.connect(owner).setApprovalForAll(trove.address, true);

    // Approve erc1155 to trove
    await erc1155.connect(owner).setApprovalForAll(trove.address, true);
    await erc1155_2.connect(owner).setApprovalForAll(trove.address, true);
  });

  it('QAT-34', async () => {
    let { nonce, signature } = await getSignatureAndNonce(user1.address, BigNumber.from('1'));

    /* Formulate rewards properly into struct struct RewardData {
        uint256 round;
        RewardERC20[] erc20Rewards;
        uint256[] erc20Amounts;
        RewardERC721[] erc721Rewards;
        uint256[] erc721Amounts;
        RewardERC1155[] erc1155Rewards;
        uint256[] erc1155Amounts;
    }
    */
    // Construct the RewardData object
    const rewardData = {
      round: BigNumber.from(1),
      // erc20Rewards: [
      //   {
      //     tokenAddress: erc20.address,
      //     amount: BigNumber.from('1000000000000000000'),
      //   },
      //   {
      //     tokenAddress: erc20_2.address,
      //     amount: BigNumber.from('1000000000000000000'),
      //   },
      // ],
      erc20Rewards: [],
      erc20Amounts: [],
      erc721Rewards: [],
      erc721Amounts: [],
      //  erc20Amounts: [BigNumber.from('1000000000000000000'), BigNumber.from('7000000000000000000')],
      // erc721Rewards: [
      //   {
      //     tokenAddress: erc721.address,
      //     tokenIds: [BigNumber.from(1), BigNumber.from(2)],
      //     index: BigNumber.from(0),
      //   },
      //   {
      //     tokenAddress: erc721_2.address,
      //     tokenIds: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3), BigNumber.from(4)],
      //     index: BigNumber.from(0),
      //   },
      // ],
      // erc721Amounts: [BigNumber.from(2), BigNumber.from(4)],
      erc1155Rewards: [
        {
          tokenAddress: erc1155.address,
          tokenIds: [BigNumber.from(4), BigNumber.from(5), BigNumber.from(6)],
          amounts: [BigNumber.from(3), BigNumber.from(3), BigNumber.from(3)],
        },
      ],
      erc1155Amounts: [[BigNumber.from(100), BigNumber.from(100), BigNumber.from(100)]],
    };

    await trove.connect(owner).topUpRewards(rewardData);

    expect((await erc1155.balanceOf(trove.address, 4)).toString()).to.equal('100');
    expect((await erc1155.balanceOf(trove.address, 5)).toString()).to.equal('100');
    expect((await erc1155.balanceOf(trove.address, 6)).toString()).to.equal('100');
    // Check user1 balances of the ERC1155
    expect((await erc1155.balanceOf(user1.address, 4)).toString()).to.equal('0');
    expect((await erc1155.balanceOf(user1.address, 5)).toString()).to.equal('0');
    expect((await erc1155.balanceOf(user1.address, 6)).toString()).to.equal('0');
    // Claim rewards
    await trove.connect(user1).claimRewards(1, nonce, signature);
    // Check user1 balances of the ERC1155
    expect((await erc1155.balanceOf(user1.address, 4)).toString()).to.equal('3');
    expect((await erc1155.balanceOf(user1.address, 5)).toString()).to.equal('3');
    expect((await erc1155.balanceOf(user1.address, 6)).toString()).to.equal('3');

    // Transfer any ERC1155 back to owner
    await erc1155.connect(user1).safeTransferFrom(user1.address, owner.address, 4, 3, '0x');
    await erc1155.connect(user1).safeTransferFrom(user1.address, owner.address, 5, 3, '0x');
    await erc1155.connect(user1).safeTransferFrom(user1.address, owner.address, 6, 3, '0x');
  });
  it('QAT-35', async () => {
    let { nonce, signature } = await getSignatureAndNonce(user1.address, BigNumber.from('2'));
    let timestamp = (await ethers.provider.getBlock('latest')).timestamp + 1000;
    let endTime = timestamp + 1000;
    // Start round
    await trove.connect(owner).startNewRound(timestamp, endTime);
    // Construct the RewardData object
    const rewardData = {
      round: BigNumber.from(2),
      erc20Rewards: [
        {
          tokenAddress: erc20.address,
          amount: ethers.parseEther('100'),
        },
      ],
      erc20Amounts: [ethers.parseEther('100')],
      erc721Rewards: [],
      erc721Amounts: [],
      erc1155Rewards: [],
      erc1155Amounts: [],
    };

    await trove.connect(owner).topUpRewards(rewardData);

    expect((await erc20.balanceOf(trove.address)).toString()).to.equal(ethers.parseEther('100'));

    // Check user1 balances of the ERC20
    expect((await erc20.balanceOf(user1.address)).toString()).to.equal(ethers.parseEther('0'));
    // Claim rewards
    await trove.connect(user1).claimRewards(2, nonce, signature);
    // Check user1 balances of the ERC20
    expect((await erc20.balanceOf(user1.address)).toString()).to.equal(ethers.parseEther('100'));

    // Transfer any ERC20 back to owner
    await erc20.connect(user1).transfer(owner.address, ethers.parseEther('100'));
  });
  it('QAT-36', async () => {
    let { nonce, signature } = await getSignatureAndNonce(user1.address, BigNumber.from('3'));
    // Start round
    // Expect round to be 3
    expect((await trove.round()).toString()).to.equal('3');
    await trove.connect(owner).startNewRound((await ethers.provider.getBlock('latest')).timestamp + 1000);
    // Construct the RewardData object
    const rewardData = {
      round: BigNumber.from(3),
      erc20Rewards: [],
      erc20Amounts: [],
      erc721Rewards: [
        {
          tokenAddress: erc721.address,
          tokenIds: [BigNumber.from(1), BigNumber.from(2)],
          index: BigNumber.from(0),
        },
        {
          tokenAddress: erc721_2.address,
          tokenIds: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3), BigNumber.from(4)],
          index: BigNumber.from(0),
        },
      ],
      erc721Amounts: [BigNumber.from(2), BigNumber.from(4)],
      erc1155Rewards: [],
      erc1155Amounts: [],
    };

    await trove.connect(owner).topUpRewards(rewardData);
    // Expect owner of ERC721 to be the trove
    expect((await erc721.ownerOf(1)).toString()).to.equal(trove.address);
    expect((await erc721.ownerOf(2)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(1)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(2)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(3)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(4)).toString()).to.equal(trove.address);

    // Claim rewards
    await trove.connect(user1).claimRewards(3, nonce, signature);
    // Check that user1 is the owner of the ERC721
    expect((await erc721.ownerOf(1)).toString()).to.equal(user1.address);
    expect((await erc721_2.ownerOf(1)).toString()).to.equal(user1.address);

    // Check that user1 did not manage to claim the rest
    expect((await erc721.ownerOf(2)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(2)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(3)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(4)).toString()).to.equal(trove.address);
  });

  it('QAT-37', async () => {
    let { nonce, signature } = await getSignatureAndNonce(user1.address, BigNumber.from('4'));
    // Start round
    await trove.connect(owner).startNewRound((await ethers.provider.getBlock('latest')).timestamp + 1000);
    // Construct the RewardData object
    const rewardData = {
      round: BigNumber.from(4),
      erc20Rewards: [
        {
          tokenAddress: erc20.address,
          amount: ethers.parseEther('100'),
        },
      ],
      erc20Amounts: [ethers.parseEther('100')],
      erc721Rewards: [
        {
          tokenAddress: erc721.address,
          tokenIds: [BigNumber.from(3), BigNumber.from(4)],
          index: BigNumber.from(0),
        },
        {
          tokenAddress: erc721_2.address,
          tokenIds: [BigNumber.from(5), BigNumber.from(6)],
          index: BigNumber.from(0),
        },
      ],
      erc721Amounts: [BigNumber.from(2), BigNumber.from(2)],
      erc1155Rewards: [
        {
          tokenAddress: erc1155.address,
          tokenIds: [BigNumber.from(4)],
          amounts: [BigNumber.from(3)],
        },
      ],
      erc1155Amounts: [[BigNumber.from(5)]],
    };

    await trove.connect(owner).topUpRewards(rewardData);
    // Expect owner of ERC721 to be the trove
    expect((await erc721.ownerOf(3)).toString()).to.equal(trove.address);
    expect((await erc721.ownerOf(4)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(5)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(6)).toString()).to.equal(trove.address);

    // Claim rewards
    await trove.connect(user1).claimRewards(4, nonce, signature);
    // Check that user1 is the owner of the ERC721
    expect((await erc721.ownerOf(3)).toString()).to.equal(user1.address);
    expect((await erc721_2.ownerOf(5)).toString()).to.equal(user1.address);

    // Check that user1 did not manage to claim the rest
    expect((await erc721.ownerOf(4)).toString()).to.equal(trove.address);
    expect((await erc721_2.ownerOf(6)).toString()).to.equal(trove.address);

    // Expect that user1 has the ERC20
    expect((await erc20.balanceOf(user1.address)).toString()).to.equal(ethers.parseEther('100'));

    // Expect that user1 has the ERC1155
    expect((await erc1155.balanceOf(user1.address, 4)).toString()).to.equal('3');

    // Transfer any ERC20 back to owner
    await erc20.connect(user1).transfer(owner.address, ethers.parseEther('100'));

    // Transfer any ERC1155 back to owner
    await erc1155.connect(user1).safeTransferFrom(user1.address, owner.address, 4, 3, '0x00');
  });
});
