import { ethers } from 'hardhat';
import { SignerWithAddress } from 'ethers';
import { expect } from 'chai';
import { MockERC20, TelegramPEPERace } from './typechain';

describe('TelegramPEPERace', function () {
  let bettingToken: MockERC20;
  let race: TelegramPEPERace;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let ownerAddress: string;
  let addr1Address: string;
  let addr2Address: string;

  before(async function () {
    const erc20Factory = await ethers.getContractFactory('MockERC20');
    const raceFactory = await ethers.getContractFactory('TelegramPEPERace');
    [owner, addr1, addr2] = await ethers.getSigners();
    [ownerAddress, addr1Address, addr2Address] = await Promise.all([
      owner.getAddress(),
      addr1.getAddress(),
      addr2.getAddress(),
    ]);
    bettingToken = await erc20Factory.deploy('MockToken', 'MockToken', 18, ethers.parseEther('1000000000'));
    // Get ERC20 deployed address
    const erc20Address = await bettingToken.getAddress();
    // Deploy TelegramPEPERace
    race = await raceFactory.deploy(erc20Address, ethers.parseEther('10'), 5, ownerAddress, 5, 30, ownerAddress);
    // Transfer betting tokens to addr1 and addr2
    await bettingToken.connect(owner).transfer(addr1Address, ethers.parseEther('1000'));
    await bettingToken.connect(owner).transfer(addr2Address, ethers.parseEther('1000'));
  });

  describe('newGame', function () {
    it('should allow a new game to be created', async function () {
      // Get race address
      let raceAddr = await race.getAddress();
      console.log('🚀 | newGame | raceAddr:', raceAddr);
      // Approve token transfers
      await bettingToken.connect(addr1).approve(raceAddr, ethers.parseEther('1000'));
      await bettingToken.connect(addr2).approve(raceAddr, ethers.parseEther('1000'));

      // Add a new game
      const drawnCards = [ethers.keccak256('0x01'), ethers.keccak256('0x02')];
      const players = [addr1Address, addr2Address];
      const bets = [ethers.parseEther('40'), ethers.parseEther('100')];
      const suits = [0, 1]; // Spades and Hearts
      await race.connect(owner).newGame(1, 7, ethers.parseEther('40'), drawnCards, players, bets, suits);

      // Check if the game is in progress
      expect(await race.isGameInProgress(1)).to.equal(true);
    });

    it('should allow a game that is in progress to be ended', async function () {
      await race.connect(owner).endGame(1, 1);

      // Check if the game is in progress
    });
  });
});
