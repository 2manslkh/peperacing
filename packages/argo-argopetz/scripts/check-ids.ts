import { request, gql } from 'graphql-request';
import { deployments, ethers } from 'hardhat';
import * as fastcsv from 'fast-csv';
import * as fs from 'fs';
function findMissingIDs(ids: number[]): number[] {
  let missingIds: number[] = [];
  let currentId = 1; // assuming ids start from 1

  for (let i = 0; i < ids.length; i++) {
    // if there is a gap in ids, push missing ids to missingIds array
    while (ids[i] > currentId) {
      missingIds.push(currentId);
      currentId++;
    }
    currentId++;
  }

  // if there are missing ids at the end
  while (currentId <= 8893) {
    missingIds.push(currentId);
    currentId++;
  }

  return missingIds;
}
async function missIds() {
  const getPetzData = async (): Promise<[]> => {
    const data: any = [];
    let hasMore = true;
    let skip = 0;
    const batchSize = 1000; // Number of records to fetch in each batch

    while (hasMore) {
      const response: { petzs: any[] } = await request(
        'https://graph.argofinance.money/subgraphs/name/argo/petz',
        gql`
          query getPetzs($batchSize: Int!, $skip: Int!) {
            petzs(orderBy: owner, orderDirection: desc, first: $batchSize, skip: $skip) {
              id
              owner
            }
          }
        `,
        { batchSize, skip }
      );

      const petzs = response.petzs;
      data.push(petzs);

      if (petzs.length < batchSize) {
        hasMore = false;
      } else {
        skip += batchSize;
      }
    }

    return data;
  };

  let petzData: any = await getPetzData();
  console.log(`Petz data Length: ${petzData.length}`);
  // Loop through petzdata
  let tokenIds: any = [];
  for (let i = 0; i < petzData.length; i++) {
    for (let j = 0; j < petzData[i].length; j++) {
      tokenIds.push(petzData[i][j].id);
    }
  }
  // Sort tokenIds in ascending order
  tokenIds.sort((a: any, b: any) => a - b);
  // Find missing ids
  let missingIds = findMissingIDs(tokenIds);
  console.log(`Missing Ids: ${missingIds}`);
}

async function main() {
  await missIds();
}

main();
