import 'dotenv/config';

import { Contract } from 'ethers';
import { Deployment } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

/**
 * This deployment file will help to check for changes and set the address of the new contract
 */

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }: HardhatRuntimeEnvironment) => {
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let networkName = network.name;
  if (networkName == 'hardhat') {
    networkName = 'localhost';
  }

  console.log('Collecting Addresses and Block Numbers for:', networkName);

  const START_BLOCK_SUFFIX = `_start_block`;
  const ADDRESS_SUFFIX = `_address`;

  function getAddress(contract: Deployment | Contract | null): string {
    if (contract) {
      return contract.address;
    }
    return '';
  }

  function getBlockNumber(contract: Deployment | Contract | null): string {
    if (contract) {
      if (contract.receipt) return contract.receipt.blockNumber;
    }
    return '';
  }

  function getAbi(contract: Deployment | Contract | null): string {
    if (contract) {
      return contract.abi;
    }
    return '';
  }

  // Remove "Mock" from the name
  function removeMock(name: string): string {
    return name.replace('Mock', '');
  }

  // Chain Dependent Settings
  let xargo: Contract;
  let argonauts: Contract;
  if (chainId == '25') {
  } else if (chainId == '338') {
  } else if (chainId == '31337') {
  } else {
  }

  // Get All Files in the deployments folder
  const files = fs.readdirSync(path.join(__dirname, '../deployments', networkName));

  // Filter by .json files
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  // Get the contract names
  const contractNames = jsonFiles.map((f) => f.replace('.json', ''));

  // Create a mapping for contract name to address and block number
  let addressAndBlockNumbers: any = {};

  // Console log a table of the contract's name, address, and block number
  const entries = await Promise.all(
    contractNames.map(async (name: string) => {
      const contract = await deployments.get(name);
      name = removeMock(name);
      addressAndBlockNumbers[`${name}${ADDRESS_SUFFIX}`] = getAddress(contract);
      addressAndBlockNumbers[`${name}${START_BLOCK_SUFFIX}`] = getBlockNumber(contract);

      // Copy ABI
      // Check if file exists
      fs.writeFileSync(
        path.join(__dirname, '..', '..', 'constants', 'abis', `${name}.json`),
        JSON.stringify(getAbi(contract))
      );

      return {
        name: name,
        address: getAddress(contract),
        blockNumber: getBlockNumber(contract),
      };
    })
  );

  console.table(entries);

  // Add Additional Contract Addresses and Block Numbers
  if (chainId == '25') {
  }

  // Check if file exists
  if (!fs.existsSync(path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`))) {
    fs.writeFileSync(
      path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`),
      JSON.stringify({
        network: networkName.replace('-', '_'),
        burner_address: '0x0000000000000000000000000000000000000000',
        abis: './node_modules/@argo/constants/abis/',
      })
    );
  }

  // Read config file from subgraph/packages/config
  const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`), 'utf8')
  );

  // Append Address and Block Numbers to config
  const atlantisConfig = {
    ...config,
    ...addressAndBlockNumbers,
  };
  fs.writeFileSync(
    path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`),
    JSON.stringify(atlantisConfig, null, 2)
  );

  // Write abis to abi folder
  // Check if file exists
  if (!fs.existsSync(path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`))) {
    fs.writeFileSync(
      path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`),
      JSON.stringify({
        network: networkName.replace('-', '_'),
      })
    );
  }

  // Read config file from ../subgraph/argoquest/networks.json
  /* Assuming networks.json looks like this:
  {
  "cronos_testnet": { "ArgoPetz": {}, "StarMapCrafting": {}, "ArgoQuest": {} },
  "cronos_mainnet": {
    "ArgoPetz": {},
    "StarMapCrafting": {},
    "ArgoQuest": {}
  }
}
  */

  const networks = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'subgraph', 'argoquest', 'networks.json'), 'utf8')
  );

  // Append Address and Block Numbers to config
  const atlantisNetworks = {
    ...networks,
    [networkName]: addressAndBlockNumbers,
  };
  fs.writeFileSync(
    path.join(__dirname, '..', 'subgraph', 'argoquest', 'networks.json'),
    JSON.stringify(atlantisNetworks, null, 2)
  );

  // Write abis to abi folder

  // Check if folder exists
  if (!fs.existsSync(path.join(__dirname, '..', 'subgraph', 'argoquest', 'abis'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'subgraph', 'argoquest', 'abis'));
  }
  // Write abis from deployments folder to subgraph/argoquest/abis
  jsonFiles.forEach((f) => {
    // Check if file exists
    if (!fs.existsSync(path.join(__dirname, '..', 'subgraph', 'argoquest', 'abis', f))) {
      fs.writeFileSync(
        path.join(__dirname, '..', 'subgraph', 'argoquest', 'abis', f),
        JSON.stringify(
          JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'deployments', networkName, f), 'utf8')).abi
        )
      );
    }
  });

  const yamlFilePath = path.join(__dirname, '..', 'subgraph', 'argoquest', 'subgraph.yaml');
  const subgraphYaml: string = fs.readFileSync(yamlFilePath, 'utf8');
  const doc: any = yaml.load(subgraphYaml);

  interface AddressAndBlockNumber {
    address: string;
    startBlock: string;
  }

  const addressAndBlockNumbers2: Record<string, AddressAndBlockNumber> = {
    ArgoPetz: {
      address: addressAndBlockNumbers['ArgoPetz_address'],
      startBlock: addressAndBlockNumbers['ArgoPetz_start_block'],
    },
    StarMapCrafting: {
      address: addressAndBlockNumbers['StarMapCrafting_address'],
      startBlock: addressAndBlockNumbers['StarMapCrafting_start_block'],
    },
    ArgoQuest: {
      address: addressAndBlockNumbers['ArgoQuest_address'],
      startBlock: addressAndBlockNumbers['ArgoQuest_start_block'],
    },
  };

  // Update values in the YAML
  doc.dataSources.forEach((dataSource: any) => {
    const name = dataSource.name;
    if (addressAndBlockNumbers2[name]) {
      dataSource.source.address = addressAndBlockNumbers2[name].address;
      dataSource.source.startBlock = addressAndBlockNumbers2[name].startBlock;
    }
  });

  // Write the updated YAML back to the file
  fs.writeFileSync(yamlFilePath, yaml.dump(doc));
};

module.exports.tags = ['Setter'];
