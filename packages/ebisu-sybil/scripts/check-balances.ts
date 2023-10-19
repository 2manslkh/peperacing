import { ethers } from 'ethers';
import fs from 'fs';
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/9b31f219103349719b084f60a0d8ad83');

function isValidPrivateKey(key: string): boolean {
    return /^(0x)?[0-9a-fA-F]{64}$/.test(key);
}

async function main() {
    const fundedWallets: string[] = [];
    try {
        const data = fs.readFileSync('./scripts/hexStrings.txt', 'utf-8');
        const privateKeys = data.split('\n').filter(line => line.trim() !== '');
        const funded = ['0x7B2419E0Ee0BD034F7Bf24874C12512AcAC6e21C', '0xDC5b20847F43d67928F49Cd4f85D696b5A7617B5', '0xFc32402667182d11B29fab5c5e323e80483e7800', '0xfaE394561e33e242c551d15D4625309EA4c0B97f', '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf', '0x84A9F188d7BCa34B341D9300B4768cE7e65925aF', '0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF', '0xe0dd44773F7657b11019062879D65F3D9862460c', '0x3744e21aCEd56c2cD0785eBbBd96E72C3811e851', '0x36eaB6CE7fedEDc098Ef98C41E83548A89147131', '0xE57bFE9F44b819898F47BF37E5AF72a0783e1141', '0xAe72A48c1a36bd18Af168541c53037965d26e4A8', '0x5A83529ff76Ac5723A87008c4D9B436AD4CA7d28', '0x8735015837bD10e05d9cf5EA43A2486Bf4Be156F' ]
        let mapping = new Map();
        let i = 0
        console.log("Total wallets: ", privateKeys.length)
        for (let privateKey of privateKeys) {
            
            i++;
            console.log("Wallet number: ", i)
            if (i < 900){
                continue;
            }
               if (!isValidPrivateKey(privateKey)) {
                console.error(`Invalid private key: ${privateKey}`);
                continue;
            }try{
            const wallet = new ethers.Wallet(privateKey, provider);
            let balance = await provider.getBalance(wallet.address);
            // Map private key to wallet address
            mapping.set(privateKey, wallet.address);

            if(balance > 0){
            fundedWallets.push(wallet.address);
            console.log("Wallet address: ", wallet.address)
            console.log("Balance: ", ethers.formatEther(balance))
            console.log("Private key: ", privateKey);
            }
            else{
            console.log("Wallet address: ", wallet.address)
            }
        }
            catch (err) {
                console.error(`Error occurred: ${err.message}`);
            }
        }

        console.log('Funded wallets:', fundedWallets.join(', '), '\n');
        // loop through funded wallets and get private key
        for (let wallet of fundedWallets) {
            for (let [key, value] of mapping) {
                if (wallet === value) {
                    console.log(`Private key for ${wallet} is ${key}`);
                }
            }
        }
    } catch (err) {
        console.error('Error reading or processing the file:', err);
    }
}

main().catch((error) => {
    console.error(`Error occurred: ${error.message}`);
});