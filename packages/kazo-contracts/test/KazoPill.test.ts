import { ethers } from 'hardhat';
import { SignerWithAddress } from 'ethers';
import { expect } from 'chai';
import { KazoPill } from './typechain';

describe('KazoPill', function () {
  let KazoPill: KazoPill;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let ownerAddress: string;
  let addr1Address: string;
  let addr2Address: string;

  beforeEach(async function () {
    const KazoPillFactory = await ethers.getContractFactory('KazoPill');
    [owner, addr1, addr2] = await ethers.getSigners();
    [ownerAddress, addr1Address, addr2Address] = await Promise.all([
      owner.getAddress(),
      addr1.getAddress(),
      addr2.getAddress(),
    ]);
    KazoPill = await KazoPillFactory.deploy('KazoPill', 'KZO', ethers.parseEther('0.00005'), 1, ownerAddress);
  });

  it('Should mint the correct quantity to the sender', async function () {
    await KazoPill.connect(addr1).mint(5, { value: ethers.parseEther('0.00025') });
    const balance = await KazoPill.balanceOf(addr1);
    expect(balance).to.equal(5);
  });

  it('Should return correct metadata', async function () {
    let balanceAddr1 = await ethers.provider.getBalance(addr1Address);
    console.log('Balance eth before mint: ', ethers.formatEther(balanceAddr1));
    await KazoPill.connect(addr1).mint(5, { value: ethers.parseEther('0.00025') });
    let balanceAddr1After = await ethers.provider.getBalance(addr1Address);
    console.log('Balance eth after mint: ', ethers.formatEther(balanceAddr1After));
    expect(await KazoPill.totalSupply()).to.equal(5);
    for (let i = 1; i <= 5; i++) {
      let metadata = await KazoPill.tokenURI(i);
      console.log(metadata);
    }
    let balanceBefore = await ethers.provider.getBalance(ownerAddress);
    await KazoPill.connect(owner).withdraw();
    let balanceAfter = await ethers.provider.getBalance(ownerAddress);
    expect(balanceBefore).to.be.gt(balanceAfter);
  });
});
