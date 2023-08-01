import { ContractConfig, defineConfig } from '@wagmi/cli'
import { actions, react } from '@wagmi/cli/plugins'

import fs from 'fs'

let contracts

function readDeployments(): ContractConfig<number, undefined>[] {
  console.log("Read deployments");
  const out: any = {};
  // Get list of folders in deployments
  const folders = fs.readdirSync("./node_modules/@argo/constants/config");

  folders.forEach((file) => {
    const json = JSON.parse(fs.readFileSync(`./node_modules/@argo/constants/config/${file}`).toString());


    // Iterate through 'contracts' object and create a ContractConfig for each contract
    try {
      Object.keys(json.contracts).forEach((contractName) => {

        // Check if object key exists in out
        if (!out[contractName]) {
          out[contractName] = {
            name: contractName,
            address: { [json.chainId]: json.contracts[contractName].address },
            abi: json.contracts[contractName]["abi"],
          };
        } else {
          // if it already exists, just append the address to the address object
          out[contractName] = {
            ...out[contractName],
            address: { ...out[contractName].address, [json.chainId]: json.contracts[contractName].address },
          };
        }
      });
    }
    catch (e) {
      console.error(e)
    }

  });

  // loop through out and create a ContractConfig for each contract
  let contracts: ContractConfig<number, undefined>[] = []
  Object.keys(out).forEach((contractName) => {
    contracts.push({
      name: contractName,
      address: out[contractName].address,
      abi: out[contractName].abi,
    });
  });
  return contracts;
}

export default defineConfig({
  out: 'src/generated.ts',
  contracts: readDeployments(),
  plugins: [
    react(),
  ],
})
