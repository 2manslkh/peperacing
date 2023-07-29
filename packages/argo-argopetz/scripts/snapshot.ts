import { deployments, ethers } from 'hardhat';
import { request, gql } from 'graphql-request';

import * as fastcsv from 'fast-csv';
import * as fs from 'fs';

async function main() {
  const getPlanetLeaderboard = async (): Promise<Map<string, number>> => {
    const planetCountsByOwner = new Map<string, number>();
    let hasMore = true;
    let skip = 0;
    const batchSize = 1000; // Number of records to fetch in each batch

    while (hasMore) {
      const response: { planets: any[] } = await request(
        'https://graph.argofinance.money/subgraphs/name/argo/wallet',
        gql`
          query getPlanetLeaderboard($batchSize: Int!, $skip: Int!) {
            planets(orderBy: owner, orderDirection: desc, first: $batchSize, skip: $skip) {
              tokenId
              owner
              level
            }
          }
        `,
        { batchSize, skip }
      );

      const planets = response.planets;
      planets.forEach((planet) => {
        const owner = planet.owner;
        if (planetCountsByOwner.has(owner)) {
          planetCountsByOwner.set(owner, planetCountsByOwner.get(owner)! + 1);
        } else {
          planetCountsByOwner.set(owner, 1);
        }
      });

      if (planets.length < batchSize) {
        hasMore = false;
      } else {
        skip += batchSize;
      }
    }

    return planetCountsByOwner;
  };

  const GRAPH_API_ARGO = 'https://graph.argofinance.money/subgraphs/name/argo/snapshot';

  const getArgonautsLeaderboard = async (): Promise<Map<string, number>> => {
    const argonautsCountsByOwner = new Map<string, number>();
    let hasMore = true;
    let skip = 0;
    const batchSize = 1000; // Number of records to fetch in each batch

    while (hasMore) {
      const response: { argonauts: any[] } = await request(
        GRAPH_API_ARGO,
        gql`
          query getArgonautsLeaderboard($batchSize: Int!, $skip: Int!) {
            argonauts(first: $batchSize, skip: $skip) {
              id
              owner
            }
          }
        `,
        { batchSize, skip }
      );

      const argonauts = response.argonauts;
      argonauts.forEach((argonaut) => {
        const owner = argonaut.owner;
        if (argonautsCountsByOwner.has(owner)) {
          argonautsCountsByOwner.set(owner, argonautsCountsByOwner.get(owner)! + 1);
        } else {
          argonautsCountsByOwner.set(owner, 1);
        }
      });

      if (argonauts.length < batchSize) {
        hasMore = false;
      } else {
        skip += batchSize;
      }
    }

    return argonautsCountsByOwner;
  };

  // Get planet leaderboard and save to csv
  const planetLeaderboard = await getPlanetLeaderboard();
  // Console log length of planet leaderboard
  console.log(`Planet Leaderboard Length: ${planetLeaderboard.size}`);
  const planetLeaderboardCsvStream = fs.createWriteStream('planetSnapshot.csv');
  const planetLeaderboardCsvStreamFastCsv = fastcsv.format({ headers: true });
  planetLeaderboardCsvStreamFastCsv.pipe(planetLeaderboardCsvStream);
  planetLeaderboard.forEach((count, owner) => {
    planetLeaderboardCsvStreamFastCsv.write({ owner, count });
  });
  planetLeaderboardCsvStreamFastCsv.end();
  // Get argonauts leaderboard and save to csv
  const argonautsLeaderboard = await getArgonautsLeaderboard();
  // Console log length of argonauts leaderboard
  console.log(`Argonauts Leaderboard Length: ${argonautsLeaderboard.size}`);
  const argonautsLeaderboardCsvStream = fs.createWriteStream('argonautsSnapshot.csv');
  const argonautsLeaderboardCsvStreamFastCsv = fastcsv.format({ headers: true });

  argonautsLeaderboardCsvStreamFastCsv.pipe(argonautsLeaderboardCsvStream);
  argonautsLeaderboard.forEach((count, owner) => {
    argonautsLeaderboardCsvStreamFastCsv.write({ owner, count });
  });
  await new Promise((resolve, reject) => {
    argonautsLeaderboardCsvStreamFastCsv.on('end', resolve);
    argonautsLeaderboardCsvStreamFastCsv.on('error', reject);
    argonautsLeaderboardCsvStreamFastCsv.end();
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
