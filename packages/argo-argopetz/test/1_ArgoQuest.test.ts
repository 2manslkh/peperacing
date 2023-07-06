import { expect } from 'chai';
const { ethers, deployments } = require('hardhat');
import { ArgoQuest, ArgoPetz, MockERC721 } from '../typechain';
import { BigNumber } from 'ethers';

describe('ArgoQuest', () => {
  let argoQuest: ArgoQuest;
  let argonauts: MockERC721;
  let argopetz: ArgoPetz;
  let owner: any;
  let user1: any;
  let user2: any;
  let users: any;

  before(async () => {
    // Get signers
    users = await ethers.getSigners();
    [owner, user1, user2] = users;

    // Deploy mock ERC721 for argonauts and argopetz
    const MockERC721Factory = await ethers.getContractFactory('MockERC721', owner);
    argonauts = await MockERC721Factory.deploy('Argonauts', 'ARGONAUTS');
    // Deploy ArgoPetz contract
    const ArgoPetzFactory = await ethers.getContractFactory('ArgoPetz', owner);
    argopetz = await ArgoPetzFactory.deploy(
      'ArgoPetz',
      'PETZ',
      'https://api.argopetz.com/',
      20,
      owner.address,
      '0x6A952f966c5DcC36A094c8AB141f027fb58F864e'
    );
    await argopetz.setStage(3);
    await argopetz.setPublicMintPrice(ethers.utils.parseEther('0'));
    // Deploy ArgoQuest contract
    const ArgoQuestFactory = await ethers.getContractFactory('ArgoQuest', owner);
    argoQuest = await ArgoQuestFactory.deploy(argonauts.address, argopetz.address);

    // Mint out argopetz to user1
    await argopetz.publicMint(user1.address, 20);
    await argonauts.connect(user1).mint(40);
    await argoQuest.setCanQuest(true);
    await argopetz.connect(user1).setApprovalForAll(argoQuest.address, true);
    await argonauts.connect(user1).setApprovalForAll(argoQuest.address, true);
  });

  it('Should start a quest', async () => {
    // Mint argonauts and argopetz tokens
    await argonauts.connect(user1).mint(1);
    // Start quest
    await argoQuest.connect(user1).startQuest(1, [2]);

    // Check if quest started
    const { lastQuestedAt, crewTokenIds } = await argoQuest.getTokenInfo(1);
    expect(lastQuestedAt).to.be.gt(0);
    expect(crewTokenIds).to.deep.equal([2]);
    // Check that user1 does not own the argonaut anymore
    const ownerOfArgonaut = await argonauts.ownerOf(1);
    expect(ownerOfArgonaut).to.equal(argoQuest.address);
    // Check that user1 does not own the argopetz anymore
    const ownerOfArgopetz = await argopetz.ownerOf(2);
    expect(ownerOfArgopetz).to.equal(argoQuest.address);
  });

  it('Should edit a quest', async () => {
    // Edit quest
    await argoQuest.connect(user1).editQuest(1, [2, 3]);

    // Check if quest edited
    const { crewTokenIds } = await argoQuest.getTokenInfo(1);
    expect(crewTokenIds).to.deep.equal([2, 3]);
  });

  it('Should stop a quest', async () => {
    // Stop quest
    await argoQuest.connect(user1).stopQuest(1);

    // Check if quest stopped
    const { lastQuestedAt } = await argoQuest.getTokenInfo(1);
    expect(lastQuestedAt).to.equal(0);
  });

  it('Should not allow starting a quest if canQuest is false', async () => {
    await argoQuest.setCanQuest(false);
    await expect(argoQuest.connect(user1).startQuest(2, [4])).to.be.revertedWith('questing not open');
    await argoQuest.setCanQuest(true);
  });

  it('Should not allow starting a quest with more than the maximum allowed crews', async () => {
    await expect(argoQuest.connect(user1).startQuest(2, [4, 5, 6, 7])).to.be.revertedWith(
      'too many crews [argopetzTokenIds]'
    );
  });

  it('Should not allow editing a quest that has not been started', async () => {
    await expect(argoQuest.connect(user1).editQuest(3, [5])).to.be.revertedWith(
      'quested not started for [argonaut tokenId]'
    );
  });

  it('Should not allow stopping a quest that has not been started', async () => {
    await expect(argoQuest.connect(user1).stopQuest(3)).to.be.revertedWith(
      'quested not started for [argonaut tokenId]'
    );
  });

  it('Should not allow removing a crew if not the owner', async () => {
    await expect(argoQuest.connect(user2).removeCrew(2)).to.be.revertedWith('not argopetz owner');
  });

  it('Should not allow non-owner to change canQuest status', async () => {
    await expect(argoQuest.connect(user1).setCanQuest(false)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should not allow non-owner to set Argonauts and ArgoPetz contracts', async () => {
    await expect(argoQuest.connect(user1).setArgonauts(user2.address)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
    await expect(argoQuest.connect(user1).setArgopetz(user2.address)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });
  it('Should allow checking if an ArgoPetz is questing', async () => {
    await argoQuest.connect(user1).startQuest(4, [2]);
    const isQuesting = await argoQuest.isArgopetzQuesting(2);
    expect(isQuesting).to.be.true;
  });

  it('Should not allow starting a quest with an Argonaut that is already questing', async () => {
    await expect(argoQuest.connect(user1).startQuest(4, [6])).to.be.revertedWith(
      'quested already started for [argonaut tokenId]'
    );
  });

  it('Should not allow editing a quest to add more than the maximum allowed crews', async () => {
    await expect(argoQuest.connect(user1).editQuest(4, [2, 3, 4, 5])).to.be.revertedWith(
      'too many crews [argopetzTokenIds]'
    );
  });

  it('Should allow removing a crew from a quest', async () => {
    const isQuesting = await argoQuest.isArgopetzQuesting(2);
    expect(isQuesting).to.be.true;
    let { crewTokenIds } = await argoQuest.getTokenInfo(4);
    expect(crewTokenIds).to.deep.equal([2]);
    await argoQuest.connect(user1).removeCrew(2);
    ({ crewTokenIds } = await argoQuest.getTokenInfo(4));
    expect(crewTokenIds).to.deep.equal([]);
  });
});
