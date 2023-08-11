import { request, gql } from 'graphql-request';
import { deployments, ethers } from 'hardhat';
import * as fastcsv from 'fast-csv';
import * as fs from 'fs';

async function snapshot(milestone: number) {
  const getPetzData = async (): Promise<Map<string, number>> => {
    const petzsCountsByOwner = new Map<string, number>();
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
      petzs.forEach((petz) => {
        const owner = petz.owner;
        if (petzsCountsByOwner.has(owner)) {
          petzsCountsByOwner.set(owner, petzsCountsByOwner.get(owner)! + 1);
        } else {
          petzsCountsByOwner.set(owner, 1);
        }
      });

      if (petzs.length < batchSize) {
        hasMore = false;
      } else {
        skip += batchSize;
      }
    }

    return petzsCountsByOwner;
  };

  const petzData = await getPetzData();
  console.log(`Petz data Length: ${petzData.size}`);
  let data = Array.from(petzData, ([address, amount]) => ({ address, amount }));

  let ws = fs.createWriteStream('petzSnapshot' + milestone + '.csv');

  fastcsv
    .write(data, { headers: true })
    .on('finish', function () {
      console.log('Write to PetzData.csv successfully!');
    })
    .pipe(ws);
}

async function main() {
  const milestones = [8893n]; // Note: 'n' after the numbers means they are BigInt
  let nextMilestoneIndex = 0;

  const argopetz = await ethers.getContractAt('ArgoPetz', '0xd32c596994a07946699caea4e669c6e284a85958');

  while (nextMilestoneIndex < milestones.length) {
    const currentSupply = BigInt((await argopetz.totalSupply()).toString()); // Convert BigNumber to BigInt
    console.log('Current supply: ', currentSupply.toString());

    // Check if current supply is greater than or equal to the next milestone
    if (currentSupply >= milestones[nextMilestoneIndex]) {
      console.log(`Milestone ${milestones[nextMilestoneIndex]} reached.`);
      await snapshot(Number(milestones[nextMilestoneIndex]));
      // If minted out, call setStage(3);
      if (currentSupply >= 8888n) {
        await argopetz.setStage(3);
      }
      nextMilestoneIndex += 1; // Move to the next milestone
    }

    // Delay the loop, so we're not constantly querying the contract
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay for 10 seconds
  }

  console.log('All milestones reached!');
}

main();
