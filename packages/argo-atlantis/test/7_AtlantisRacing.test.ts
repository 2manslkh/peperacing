import 'dotenv/config';

import { AtlantisEquipments } from '../typechain/contracts/AtlantisEquipments';
import { AtlantisRacing } from '../typechain/contracts/AtlantisRacing';
import { AtlantisSpaceships } from '../typechain/contracts/AtlantisSpaceships';
import { Gold } from '../typechain/contracts/Gold';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Stardust } from '../typechain/contracts/Stardust';
import { StakingWithLock } from '../typechain';
import { AtlantisFaucet } from '../typechain';
import { MockArgonauts } from '../typechain';
import { chunkArray } from '../utils/helper';
import { expect } from 'chai';

const { ethers, deployments } = require('hardhat');

let owner: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;

let atlantisSpaceships: AtlantisSpaceships;
let atlantisRacing: AtlantisRacing;
let atlantisEquipments: AtlantisEquipments;
let gold: Gold;
let stardust: Stardust;
let argonauts: MockArgonauts;
let staking: StakingWithLock;
let faucet: AtlantisFaucet;

describe('AtlantisRacing', function () {
  before(async function () {
    // Get Signers
    [owner, user1, user2] = await ethers.getSigners();

    // Setup Test
    await deployments.fixture(['Phase1', 'Phase2', 'Mock', 'AtlantisFaucet']);
    atlantisSpaceships = await ethers.getContract('AtlantisSpaceships', owner);
    atlantisEquipments = await ethers.getContract('AtlantisEquipments', owner);
    atlantisRacing = await ethers.getContract('AtlantisRacing', owner);
    argonauts = await ethers.getContract('MockArgonauts', owner);
    gold = await ethers.getContract('Gold', owner);
    stardust = await ethers.getContract('Stardust', owner);
    staking = await ethers.getContract('StakingWithLock', owner);
    faucet = await ethers.getContract('AtlantisFaucet', owner);
    await faucet.whitelistAddresses([owner.address, user1.address, user2.address]);
    // Transfer 1200 ether to faucet
    await owner.sendTransaction({ to: faucet.address, value: ethers.utils.parseEther('1200') });
    // await faucet.connect(owner).drip();
    // await faucet.connect(user1).drip();
    // await faucet.connect(user2).drip();

    // Mint stardust and gold to atlantisRacing contract
    // await stardust.connect(owner).devMint(ethers.utils.parseEther('1000000'));
    // await gold.connect(owner).devMint(ethers.utils.parseEther('20000000'));
    // Stake gold for stardust
    await gold.connect(owner).approve(staking.address, ethers.utils.parseEther('10000000'));
    await staking.connect(owner).stake(ethers.utils.parseEther('10000000'));
    // Transfer to atlantisRacing contract
    await stardust.connect(owner).transfer(atlantisRacing.address, ethers.utils.parseEther('10000000'));
    await gold.connect(owner).transfer(atlantisRacing.address, ethers.utils.parseEther('10000000'));
    // Set stardust cost on AtlantisEquipments
    await atlantisEquipments
      .connect(owner)
      .setStardustCosts([
        ethers.utils.parseEther('250'),
        ethers.utils.parseEther('360'),
        ethers.utils.parseEther('490'),
        ethers.utils.parseEther('640'),
        ethers.utils.parseEther('810'),
      ]);
    // Set gemstones cost on AtlantisEquipments
    await atlantisEquipments.connect(owner).setGemstonesRequired([9, 13, 19, 27, 40]);
    // Set Equipment speeds on AtlantisEquipments
    await atlantisEquipments.connect(owner).setEquipmentSpeeds([5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);

    // Mint one of each element of each level
    // Id 1 - 10 are Fire
    // Id 11 - 20 are Lightning
    // Id 21 - 30 are Steel
    // for (let i = 1; i <= 30; i++) {
    //   await atlantisEquipments.connect(owner).airdrop(user1.address, i, 1, '0x');

    //   expect(await atlantisEquipments.totalSupply(i)).to.be.equals(1);
    // }
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

    await atlantisRacing.setWhitelistedCollections([argonauts.address], true);

    let spaceshipIdsChunked = chunkArray(spaceshipIds, 500);
    let randomNumbersChunked = chunkArray(randomNumbers, 500);
  });
  before(async function () {
    // await atlantisRacing.startSeason();
    // // Expect season to be active
    // expect(await atlantisRacing.seasonStarted()).to.be.true;
  });

  describe('Constants', function () {});

  describe('Game', function () {
    beforeEach(async function () {
      // Check balance of stardust in racing contract
      console.log('Stardust in racing contract: ', (await stardust.balanceOf(atlantisRacing.address)).toString());
    });
    describe('Staking Multiple Spaceships', function () {
      it('Should stake multiple spaceships', async function () {
        let rewards;
        // Mint out all spaceships to owner
        // Console log spaceships total supply
        console.log('Spaceships total supply: ', (await atlantisSpaceships.totalSupply()).toString());
        await atlantisSpaceships
          .connect(owner)
          .airdrop(
            [
              owner.address,
              owner.address,
              owner.address,
              owner.address,
              owner.address,
              owner.address,
              owner.address,
              owner.address,
              owner.address,
            ],
            [0, 2, 3, 1, 1, 1, 0, 2, 3]
          );

        console.log('Spaceships total supply: ', (await atlantisSpaceships.totalSupply()).toString());
        // Transfer id 10 spaceship to user1
        await atlantisSpaceships.connect(owner).transferFrom(owner.address, user1.address, 3);
        await atlantisSpaceships.connect(owner).transferFrom(owner.address, user1.address, 7);
        // Approve spaceships contract for user1 to transfer Spaceships
        await atlantisSpaceships.connect(user1).setApprovalForAll(atlantisRacing.address, true);
        // Approve spaceships contract for owner to transfer Spaceships
        await atlantisSpaceships.connect(owner).setApprovalForAll(atlantisRacing.address, true);
        await atlantisSpaceships.connect(user1).setApprovalForAll(atlantisRacing.address, true);
        // Dev mint argonauts to owner
        // await argonauts.connect(owner).mint(20);
        await argonauts.connect(owner).setApprovalForAll(atlantisRacing.address, true);
        // Transfer user1 1 spaceship
        await atlantisSpaceships.connect(owner).transferFrom(owner.address, user1.address, 6);
        // start season
        // await atlantisSpaceships.modifyEquipment(1, 4, 5, 6);
        // Log speeds
        // let speeds = await atlantisRacing.viewTotalSpeeds(owner.address);
        // for (let i = 0; i < speeds.length; i++) {
        //   console.log('Pool: ', i, ' Speed: ', speeds[i].toString());
        // }
        // Stake 1 spaceship from owner
        await atlantisRacing.startSeason();
        await atlantisRacing.connect(owner).stakeSpaceships([1, 4, 2]);
        console.log('After stake 1');

        // // Stake 2 nfts
        // await atlantisRacing
        //   .connect(owner)
        //   .stakeNfts(1, [argonauts.address, argonauts.address, argonauts.address, argonauts.address], [1, 2, 3, 4]);
        // console.log('After staking 4 argonauts');
        // speeds = await atlantisRacing.viewTotalSpeeds(owner.address);
        // for (let i = 0; i < speeds.length; i++) {
        //   console.log('Pool: ', i, ' Speed: ', speeds[i].toString());
        // }
        let beforeBalance = await stardust.balanceOf(owner.address);
        // await atlantisRacing.startSeason();
        console.log('Before balance: ', ethers.utils.formatEther(beforeBalance.toString()));
        // Wait 1 minute
        await ethers.provider.send('evm_increaseTime', [600]);
        // Mine
        await ethers.provider.send('evm_mine');
        for (let i = 0; i < 4; i++) {
          rewards = await atlantisRacing.viewRewards(owner.address, i);
          console.log(
            'Pool: ',
            i,
            ' Stardust: ',
            ethers.utils.formatEther(rewards[0]),
            ' Gold: ',
            ethers.utils.formatEther(rewards[1])
          );
        }
        // await atlantisRacing.connect(owner).getRewards();
        // let afterBalance = await stardust.balanceOf(owner.address);
        // console.log('After balance: ', ethers.utils.formatEther(afterBalance.toString()));

        await atlantisRacing.connect(user1).stakeSpaceships([3, 7]);
        // Wait 10 minutes
        await ethers.provider.send('evm_increaseTime', [600]);
        // Mine
        await ethers.provider.send('evm_mine');
        // Check rewards
        for (let i = 0; i < 4; i++) {
          rewards = await atlantisRacing.viewRewards(owner.address, i);
          console.log(
            'Pool: ',
            i,
            ' Stardust: ',
            ethers.utils.formatEther(rewards[0]),
            ' Gold: ',
            ethers.utils.formatEther(rewards[1])
          );
        }

        // Increase time by 1 day
        await ethers.provider.send('evm_increaseTime', [86400]);
        // Mine
        await ethers.provider.send('evm_mine');
        console.log('Affter 1 day');
        // Check rewards again
        for (let i = 0; i < 4; i++) {
          rewards = await atlantisRacing.viewRewards(owner.address, i);
          console.log(
            'Pool: ',
            i,
            ' Stardust: ',
            ethers.utils.formatEther(rewards[0]),

            ' Gold: ',
            ethers.utils.formatEther(rewards[1])
          );
        }

        // Claim rewards
        await atlantisRacing.connect(owner).getRewards();
      });
      // describe('Staking Spaceships', function () {
      //   before(async function () {
      //     // Mint out all spaceships to owner
      //     await atlantisSpaceships.connect(owner).devMint([0, 2, 3, 1, 1, 1, 0, 2, 3]);
      //     // Transfer id 1 spaceship to user1
      //     await atlantisSpaceships.connect(owner).transferFrom(owner.address, user1.address, 1);
      //     // Transfer ids 2 - 50 spaceship to user1 with a for loop
      //     for (let i = 2; i <= 9; i++) {
      //       await atlantisSpaceships.connect(owner).transferFrom(owner.address, user1.address, i);
      //     }
      //     // Mint argonauts to user1
      //     await argonauts.connect(owner).mint(50);
      //     // Transfer all argonauts id 1-50 to user1
      //     for (let i = 1; i <= 49; i++) {
      //       await argonauts.connect(owner).transferFrom(owner.address, user1.address, i);
      //     }

      //     // Approve argonauts contract for user1 to transfer argonauts
      //     await argonauts.connect(user1).setApprovalForAll(atlantisRacing.address, true);
      //     // Approve racing contract for user1 to transfer spaceship
      //     await atlantisSpaceships.connect(user1).setApprovalForAll(atlantisRacing.address, true);
      //   });

      //   it('should stake spaceship', async function () {
      //     // Get details of spaceship id 1
      //     const spaceship = await atlantisSpaceships.getSpaceship(1);
      //     // Get rarity of spaceship id 1
      //     const rarity = await atlantisSpaceships.getRarity(1);
      //     // Stake spaceship id 1
      //     await atlantisRacing.connect(user1).stakeSpaceships([1]);
      //     let spaceshipsStaked = await atlantisRacing.viewSpaceshipsStaked(user1.address);
      //     let totalSpeeds = await atlantisRacing.viewTotalSpeeds(user1.address);
      //     // Expect spaceship to be staked
      //     expect(spaceshipsStaked).to.be.equals(1);
      //     // Get total speeds of spaceship id 1
      //     const speed = totalSpeeds;
      //     // Expect speed to be 1
      //     expect(speed[0]).to.be.equals((rarity + 1) * 10);
      //     // Expect spaceship to be owned by atlantisRacing contract
      //     expect(await atlantisSpaceships.ownerOf(1)).to.be.equals(atlantisRacing.address);
      //   });
      //   it('should revert if spaceship is not owned by user', async function () {
      //     await expect(atlantisRacing.connect(user1).stakeSpaceships([999])).to.be.revertedWith(
      //       'ERC721: invalid token ID'
      //     );
      //   });
      //   it('should revert if spaceship is already staked', async function () {
      //     await expect(atlantisRacing.connect(user1).stakeSpaceships([1])).to.be.revertedWith(
      //       'ERC721: transfer from incorrect owner'
      //     );
      //   });
      //   it('should unstake spaceship', async function () {
      //     let spaceshipsStaked = await atlantisRacing.viewSpaceshipsStaked(user1.address);
      //     // Check owner of spaceship id 1
      //     expect(await atlantisSpaceships.ownerOf(1)).to.be.equals(atlantisRacing.address);
      //     // Unstake spaceship id 1
      //     await atlantisRacing.connect(user1).unstakeSpaceships([1]);
      //     // Expect spaceship to be unstaked
      //     expect(await atlantisRacing.viewSpaceshipsStaked(user1.address)).to.be.equals(0);
      //     // Expect spaceship to be owned by user1
      //     expect(await atlantisSpaceships.ownerOf(1)).to.be.equals(user1.address);
      //   });

      //   it('should gain stardust + gold at a proper rate after staking', async function () {
      //     // Remove all gold and stardust from user1 and transfer to owner
      //     await gold.connect(user1).transfer(owner.address, await gold.balanceOf(user1.address));
      //     await stardust.connect(user1).transfer(owner.address, await stardust.balanceOf(user1.address));
      //     // Before balance of user1 stardust
      //     let user1StardustBefore = await stardust.balanceOf(user1.address);
      //     // Before balance of user1 gold
      //     let user1GoldBefore = await gold.balanceOf(user1.address);
      //     // Expect both balances to be 0

      //     expect(user1StardustBefore).to.be.equals(0);
      //     expect(user1GoldBefore).to.be.equals(0);
      //     // Log user1 balance before staking and all details of spaceship nicely
      //     console.log(
      //       'User1 balance stardust before staking: ' +
      //         user1StardustBefore.toString() +
      //         '\n' +
      //         'User1 balance gold before staking: ' +
      //         user1GoldBefore.toString()
      //     );
      //     // Check owners of spaceship ids 1-3
      //     expect(await atlantisSpaceships.ownerOf(1)).to.be.equals(user1.address);
      //     expect(await atlantisSpaceships.ownerOf(2)).to.be.equals(user1.address);
      //     expect(await atlantisSpaceships.ownerOf(3)).to.be.equals(user1.address);

      //     // Expect spaceship ids 4-6 to be owned by user1
      //     expect(await atlantisSpaceships.ownerOf(4)).to.be.equals(user1.address);
      //     expect(await atlantisSpaceships.ownerOf(5)).to.be.equals(user1.address);
      //     expect(await atlantisSpaceships.ownerOf(6)).to.be.equals(user1.address);
      //     // Transfer 3 spaceships from owner to user2
      //     await atlantisSpaceships.connect(user1).transferFrom(user1.address, user2.address, 4);
      //     await atlantisSpaceships.connect(user1).transferFrom(user1.address, user2.address, 5);
      //     await atlantisSpaceships.connect(user1).transferFrom(user1.address, user2.address, 6);
      //     // Expect spaceship ids 4-6 to be owned by user1
      //     expect(await atlantisSpaceships.ownerOf(4)).to.be.equals(user2.address);
      //     expect(await atlantisSpaceships.ownerOf(5)).to.be.equals(user2.address);
      //     expect(await atlantisSpaceships.ownerOf(6)).to.be.equals(user2.address);
      //     // Stake spaceships
      //     await atlantisRacing.connect(user1).stakeSpaceships([2, 3]);

      //     // Approve racing contract to spend user2 spaceships
      //     await atlantisSpaceships.connect(user2).setApprovalForAll(atlantisRacing.address, true);

      //     await atlantisRacing.connect(user2).stakeSpaceships([4, 5, 6]);

      //     // Get users speeds
      //     let user1Speed = await atlantisRacing.viewTotalSpeeds(user1.address);
      //     const user2Speed = await atlantisRacing.viewTotalSpeeds(user2.address);
      //     // Stake 1 argonaut in pool id 1, 2 in pool id 2 and 5 in pool id 3
      //     await atlantisRacing.connect(user1).stakeNfts(1, [argonauts.address], [1]);
      //     await atlantisRacing.connect(user1).stakeNfts(2, [argonauts.address, argonauts.address], [2, 3]);
      //     await atlantisRacing
      //       .connect(user1)
      //       .stakeNfts(
      //         3,
      //         [argonauts.address, argonauts.address, argonauts.address, argonauts.address, argonauts.address],
      //         [4, 5, 6, 7, 8]
      //       );
      //     user1Speed = await atlantisRacing.viewTotalSpeeds(user1.address);
      //     let currentlyStaked = await atlantisRacing.getCurrentlyStakedTokenIds(1, argonauts.address, user1.address);
      //     let currentlyStaked2 = await atlantisRacing.getCurrentlyStakedTokenIds(2, argonauts.address, user1.address);
      //     let currentlyStaked3 = await atlantisRacing.getCurrentlyStakedTokenIds(3, argonauts.address, user1.address);
      //     // Expect argonauts to be staked
      //     expect(currentlyStaked).to.be.deep.equals([1]);
      //     expect(currentlyStaked2).to.be.deep.equals([2, 3]);
      //     expect(currentlyStaked3).to.be.deep.equals([4, 5, 6, 7, 8]);
      //     // Wait for 1 day
      //     await ethers.provider.send('evm_increaseTime', [86400]);
      //     await ethers.provider.send('evm_mine');

      //     // Loop through poolid 0-3 and viewRewards of user 1 and user 2
      //     for (let i = 0; i < 4; i++) {
      //       let user1Rewards = await atlantisRacing.viewRewards(user1.address, i);
      //       let user2Rewards = await atlantisRacing.viewRewards(user2.address, i);
      //       console.log('User1 stardust poolid ' + i + ': ' + ethers.utils.formatEther(user1Rewards[0]));
      //       console.log('User1 gold poolid ' + i + ': ' + ethers.utils.formatEther(user1Rewards[1]));
      //       console.log('User2 stardust poolid ' + i + ': ' + ethers.utils.formatEther(user2Rewards[0]));
      //       console.log('User2 gold poolid ' + i + ': ' + ethers.utils.formatEther(user2Rewards[1]));
      //     }
      //     // Sum up all rewards
      //     let user1Rewards = await atlantisRacing.viewRewards(user1.address, 0);
      //     let user2Rewards = await atlantisRacing.viewRewards(user2.address, 0);
      //     let user1Rewards2 = await atlantisRacing.viewRewards(user1.address, 1);
      //     let user2Rewards2 = await atlantisRacing.viewRewards(user2.address, 1);
      //     let user1Rewards3 = await atlantisRacing.viewRewards(user1.address, 2);
      //     let user2Rewards3 = await atlantisRacing.viewRewards(user2.address, 2);
      //     let user1Rewards4 = await atlantisRacing.viewRewards(user1.address, 3);
      //     let user2Rewards4 = await atlantisRacing.viewRewards(user2.address, 3);
      //     let totalUser1Stardust = user1Rewards[0].add(user1Rewards2[0]).add(user1Rewards3[0]).add(user1Rewards4[0]);
      //     let totalUser2Stardust = user2Rewards[0].add(user2Rewards2[0]).add(user2Rewards3[0]).add(user2Rewards4[0]);
      //     let totalUser1Gold = user1Rewards[1].add(user1Rewards2[1]).add(user1Rewards3[1]).add(user1Rewards4[1]);
      //     let totalUser2Gold = user2Rewards[1].add(user2Rewards2[1]).add(user2Rewards3[1]).add(user2Rewards4[1]);
      //     console.log('Total user1 stardust: ' + ethers.utils.formatEther(totalUser1Stardust));
      //     console.log('Total user2 stardust: ' + ethers.utils.formatEther(totalUser2Stardust));
      //     console.log('Total user1 gold: ' + ethers.utils.formatEther(totalUser1Gold));
      //     console.log('Total user2 gold: ' + ethers.utils.formatEther(totalUser2Gold));

      //     // Unstake spaceship id 1
      //     await atlantisRacing.connect(user1).unstakeSpaceships([2, 3]);
      //     await atlantisRacing.connect(user1).unstakeNfts(1, [argonauts.address], [1]);
      //     await atlantisRacing.connect(user1).unstakeNfts(2, [argonauts.address, argonauts.address], [2, 3]);
      //     await atlantisRacing
      //       .connect(user1)
      //       .unstakeNfts(
      //         3,
      //         [argonauts.address, argonauts.address, argonauts.address, argonauts.address, argonauts.address],
      //         [4, 5, 6, 7, 8]
      //       );
      //     // After balance of user1 stardust
      //     let user1StardustAfter = await stardust.balanceOf(user1.address);
      //     // After balance of user1 gold
      //     let user1GoldAfter = await gold.balanceOf(user1.address);
      //     // Parse to ether
      //     user1StardustAfter = ethers.utils.formatEther(user1StardustAfter);
      //     user1GoldAfter = ethers.utils.formatEther(user1GoldAfter);

      //     // Log user1 balance after staking and all details of spaceship nicely
      //     console.log(
      //       'User1 balance stardust after staking: ' +
      //         user1StardustAfter.toString() +
      //         '\n' +
      //         'User1 balance gold after staking: ' +
      //         user1GoldAfter.toString()
      //     );
      //   });
      // });
    });

    describe('Admin', function () {
      beforeEach(async function () {});

      describe('Setting Season End Time', async function () {
        it('should revert if not owner', async function () {
          await expect(atlantisRacing.connect(user1).setSeasonEndTime(100)).to.be.revertedWith(
            'Ownable: caller is not the owner'
          );
        });
        it('should set season end time', async function () {
          // Get current unix time
          const currentTime = Math.floor(Date.now() / 1000);
          await atlantisRacing.connect(owner).setSeasonEndTime(currentTime + 60 * 60 * 24 * 7);
          expect(await atlantisRacing.seasonEndTime()).to.be.equals(currentTime + 60 * 60 * 24 * 7);
        });
      });
      describe('Emergency Withdraw Stardust', async function () {
        it('should revert if not owner', async function () {
          await expect(atlantisRacing.connect(user1).retrieveStardust()).to.be.revertedWith(
            'Ownable: caller is not the owner'
          );
        });
        it('should retrieve stardust', async function () {
          // Check balance of owner and save it into a variable
          const ownerStardustBalance = await stardust.balanceOf(owner.address);
          // Check balance of racing contract and save it into a variable
          const racingStardustBalance = await stardust.balanceOf(atlantisRacing.address);
          await atlantisRacing.connect(owner).retrieveStardust();
          expect(await stardust.balanceOf(atlantisRacing.address)).to.be.equals(0);
          expect(await stardust.balanceOf(owner.address)).to.be.equals(racingStardustBalance.add(ownerStardustBalance));
        });
      });
      describe('Emergency Withdraw Gold', async function () {
        it('should revert if not owner', async function () {
          await expect(atlantisRacing.connect(user1).retrieveGold()).to.be.revertedWith(
            'Ownable: caller is not the owner'
          );
        });
        it('should retrieve gold', async function () {
          // Check balance of racing contract and save it into a variable
          const racingGoldBalance = await gold.balanceOf(atlantisRacing.address);
          // Get balance of gold of owner
          const ownerGoldBalance = await gold.balanceOf(owner.address);
          await atlantisRacing.connect(owner).retrieveGold();
          expect(await gold.balanceOf(atlantisRacing.address)).to.be.equals(0);
          expect(await gold.balanceOf(owner.address)).to.be.equals(racingGoldBalance.add(ownerGoldBalance));
        });
      });
      describe('Emergency Unstake Spaceships', async function () {});
      describe('Emergency Unstake Argonauts', async function () {});
    });
  });
});
