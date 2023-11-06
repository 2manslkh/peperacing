import { Airdropper } from '../typechain';
import * as readline from 'readline';
import * as fs from 'fs';
import { ethers } from 'hardhat';

async function main() {
  // Get signer
  const signers = await ethers.getSigners();
  const refundDetails: { address: string; amount: string }[] = [];
  const airdropper = (await ethers.getContract('Airdropper')) as Airdropper;
  const rl = readline.createInterface({
    input: fs.createReadStream('scripts/refund.csv'),
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', (line) => {
    const [address, amount] = line.split(',');
    refundDetails.push({ address, amount });
  });

  await new Promise((resolve, reject) => {
    rl.on('close', resolve);
    rl.on('error', reject);
  });
  refundDetails.shift();

  let addr: string[] = [];
  let amount: string[] = [];
  for (let i = 0; i < refundDetails.length; i++) {
    addr.push(refundDetails[i].address);
    amount.push(ethers.parseEther(refundDetails[i].amount));
  }

  console.log('Refunding...');
  console.log('Addresses: ', addr);
  console.log('Amounts: ', amount);

  let tx = await airdropper.airdropETH(addr, amount, { value: ethers.parseEther('0.972') });
  console.log(tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
