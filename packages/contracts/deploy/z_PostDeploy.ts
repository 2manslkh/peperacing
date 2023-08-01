import 'dotenv/config';

import { Contract } from 'ethers';
import { Deployment } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

/**
 * This deployment file will help to check for changes and set the address of the new contract
 */

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }: HardhatRuntimeEnvironment) => {
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  let networkName = network.name
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
  let contracts: any = {};

  // Console log a table of the contract's name, address, and block number
  await Promise.all(
    contractNames.map(async (name: string) => {
      const contract = await deployments.get(name);
      name = removeMock(name);

      contracts[name] = {
        address: getAddress(contract),
        start_block: getBlockNumber(contract),
        abi: getAbi(contract),
      }
    })
  );

  console.table(contracts);

  // Add Additional Contract Addresses and Block Numbers
  if (chainId == '25') {

  }

  // Check if file exists
  if (!fs.existsSync(path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`))) {
    fs.writeFileSync(
      path.join(__dirname, '..', '..', 'constants', 'config', `${networkName}.json`),
      JSON.stringify({
        network: networkName.replace('-', '_'),
        chainId: chainId,
        burner_address: '0x0000000000000000000000000000000000000000',
        abis: "./node_modules/@argo/constants/abis/"
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
    contracts
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
        burner_address: '0x0000000000000000000000000000000000000000',
      })
    );
  }



};

module.exports.tags = ['Setter'];
