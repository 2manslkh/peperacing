import { ethers } from 'ethers';
require('dotenv').config();
async function signMessage() {
  const privateKey = process.env.PRIVATE_KEY_TESTNET;
  const wallet = new ethers.Wallet(privateKey);

  const message = `Welcome to Ebisu's Bay!

Click to sign in and accept the Ebisu's Bay Terms of Service: https://app.ebisusbay.com/terms-of-service.html

This request will not trigger a blockchain transaction or cost any gas fees.

Wallet address:
${wallet.address}`;

  const signedMessage = await wallet.signMessage(message);

  console.log(`Signed Message: ${signedMessage}`);
}

signMessage().catch((error) => {
  console.error(`Error occurred: ${error.message}`);
});
