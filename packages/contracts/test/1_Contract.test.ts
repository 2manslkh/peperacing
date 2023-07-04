import 'dotenv/config';

import { deployments, ethers } from 'hardhat';

import { Signer } from 'ethers';
import { TestContract } from '../typechain';
import { expect } from 'chai';
import { getContract } from '../utils/helper';

let owner: Signer;
let user1: Signer;
let contract: TestContract;


describe('TestContract', function () {
  beforeEach(async function () {
    // Get Signers

    [owner, user1] = await ethers.getSigners();


    // Deploy Contracts
    await deployments.fixture(['TestContract']);


    // Get Contracts
    contract = (await getContract('TestContract')) as TestContract;
    let balance = await contract.connect(owner).balances(await owner.getAddress());

  });

  it('should deposit', async function () {

    let depositValue = ethers.parseEther('1');

    await contract.connect(user1).deposit({ value: depositValue });
    await expect(await contract.balances(await user1.getAddress())).to.equal(depositValue);
  })

});
