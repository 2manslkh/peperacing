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

  const GRAPH_API_ARGOPETZ = 'https://graph.argofinance.money/subgraphs/name/argo/petz';
  const getArgoPetzLeaderboard = async (): Promise<Map<string, number>> => {
    const argoPetzCountsByOwner = new Map<string, number>();
    let hasMore = true;
    let skip = 0;
    const batchSize = 1000; // Number of records to fetch in each batch

    while (hasMore) {
      const response: { petzs: any[] } = await request(
        GRAPH_API_ARGOPETZ,
        gql`
          query getArgoPetzLeaderboard($batchSize: Int!, $skip: Int!) {
            petzs(first: $batchSize, skip: $skip) {
              id
              owner
            }
          }
        `,
        { batchSize, skip }
      );

      const argoPetz = response.petzs;
      argoPetz.forEach((argoPetz) => {
        const owner = argoPetz.owner;
        if (argoPetzCountsByOwner.has(owner)) {
          argoPetzCountsByOwner.set(owner, argoPetzCountsByOwner.get(owner)! + 1);
        } else {
          argoPetzCountsByOwner.set(owner, 1);
        }
      });

      if (argoPetz.length < batchSize) {
        hasMore = false;
      } else {
        skip += batchSize;
      }
    }

    return argoPetzCountsByOwner;
  };

  const getArgoPetzWithOwners = async (): Promise<Map<string, string>> => {
    const argoPetzMap = new Map<string, string>();
    let hasMore = true;
    let skip = 0;
    const batchSize = 1000;

    while (hasMore) {
      const response: { petzs: any[] } = await request(
        GRAPH_API_ARGOPETZ,
        gql`
          query getArgoPetzWithOwners($batchSize: Int!, $skip: Int!) {
            petzs(first: $batchSize, skip: $skip) {
              id
              owner
            }
          }
        `,
        { batchSize, skip }
      );

      const argoPetz = response.petzs;
      argoPetz.forEach((argoPetz) => {
        argoPetzMap.set(argoPetz.id, argoPetz.owner); // Each ID is unique and should not be overwritten
      });

      if (argoPetz.length < batchSize) {
        hasMore = false;
      } else {
        skip += batchSize;
      }
    }

    return argoPetzMap;
  };

  // // Get planet leaderboard and save to csv
  // const planetLeaderboard = await getPlanetLeaderboard();
  // // Console log length of planet leaderboard
  // console.log(`Planet Leaderboard Length: ${planetLeaderboard.size}`);
  // const planetLeaderboardCsvStream = fs.createWriteStream('planetSnapshot.csv');
  // const planetLeaderboardCsvStreamFastCsv = fastcsv.format({ headers: true });
  // planetLeaderboardCsvStreamFastCsv.pipe(planetLeaderboardCsvStream);
  // planetLeaderboard.forEach((count, owner) => {
  //   planetLeaderboardCsvStreamFastCsv.write({ owner, count });
  // });
  // planetLeaderboardCsvStreamFastCsv.end();
  // // Get argonauts leaderboard and save to csv
  // const argonautsLeaderboard = await getArgonautsLeaderboard();
  // // Console log length of argonauts leaderboard
  // console.log(`Argonauts Leaderboard Length: ${argonautsLeaderboard.size}`);
  // const argonautsLeaderboardCsvStream = fs.createWriteStream('argonautsSnapshot.csv');
  // const argonautsLeaderboardCsvStreamFastCsv = fastcsv.format({ headers: true });

  // argonautsLeaderboardCsvStreamFastCsv.pipe(argonautsLeaderboardCsvStream);
  // argonautsLeaderboard.forEach((count, owner) => {
  //   argonautsLeaderboardCsvStreamFastCsv.write({ owner, count });
  // });
  // await new Promise((resolve, reject) => {
  //   argonautsLeaderboardCsvStreamFastCsv.on('end', resolve);
  //   argonautsLeaderboardCsvStreamFastCsv.on('error', reject);
  //   argonautsLeaderboardCsvStreamFastCsv.end();
  // });
  // Get argopetz leaderboard and save to csv
  // const argoPetzLeaderboard = await getArgoPetzLeaderboard();
  // // Console log length of argonauts leaderboard
  // console.log(`ArgoPetz Leaderboard Length: ${argoPetzLeaderboard.size}`);
  // const argoPetzLeaderboardCsvStream = fs.createWriteStream('argoPetzSnapshot.csv');
  // const argoPetzLeaderboardCsvStreamFastCsv = fastcsv.format({ headers: true });

  // argoPetzLeaderboardCsvStreamFastCsv.pipe(argoPetzLeaderboardCsvStream);
  // argoPetzLeaderboard.forEach((count, owner) => {
  //   argoPetzLeaderboardCsvStreamFastCsv.write({ owner, count });
  // });
  // await new Promise((resolve, reject) => {
  //   argoPetzLeaderboardCsvStreamFastCsv.on('end', resolve);
  //   argoPetzLeaderboardCsvStreamFastCsv.on('error', reject);
  //   argoPetzLeaderboardCsvStreamFastCsv.end();
  // });

  // Get argopetz leaderboard and save to csv
  const argoPetzOwners = await getArgoPetzWithOwners();
  console.log('Length of argoPetzOwners: ', argoPetzOwners.size);
  // // Console log length of argonauts leaderboard
  // const argoPetzOwnersCsvStream = fs.createWriteStream('argoPetzOwnersSnapshot.csv');
  // const argoPetzOwnersCsvStreamFastCsv = fastcsv.format({ headers: true });
  // let count = 0;
  // argoPetzOwnersCsvStreamFastCsv.pipe(argoPetzOwnersCsvStream);
  // // Sort argoPetzOwners by id
  // const sortedArgoPetzOwners = new Map([...argoPetzOwners.entries()].sort());
  // sortedArgoPetzOwners.forEach((owner, id) => {
  //   argoPetzOwnersCsvStreamFastCsv.write({ id, owner });
  //   count++;
  // });
  // await new Promise((resolve, reject) => {
  //   argoPetzOwnersCsvStreamFastCsv.on('end', resolve);
  //   argoPetzOwnersCsvStreamFastCsv.on('error', reject);
  //   argoPetzOwnersCsvStreamFastCsv.end();
  // });
  // console.log('Count: ', count);

  const writeArgoPetzToCSV = async (argoPetzMap: Map<string, string>) => {
    const filePath = 'argoPetzOwnersSnapshot.csv';
    const csvStream = fs.createWriteStream(filePath);

    // Write the header
    csvStream.write('id,owner\n');

    // Sort argoPetzOwners numerically by id
    const sortedArgoPetz = new Map([...argoPetzMap.entries()].sort((a, b) => Number(a[0]) - Number(b[0])));

    sortedArgoPetz.forEach((owner, id) => {
      csvStream.write(`${id},${owner}\n`);
    });

    csvStream.end();

    return new Promise((resolve, reject) => {
      csvStream.on('finish', resolve);
      csvStream.on('error', reject);
    });
  };

  await writeArgoPetzToCSV(argoPetzOwners);
  console.log('Written count:', argoPetzOwners.size);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
