import { ethers } from 'ethers';

async function signMessage() {
  const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const wallet = new ethers.Wallet(privateKey);

  const message = 'Hello, Ethereum!';

  const signedMessage = await wallet.signMessage(message);

  console.log(`Signed Message: ${signedMessage}`);
}

signMessage().catch((error) => {
  console.error(`Error occurred: ${error.message}`);
});
