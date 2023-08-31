// Eligible.ts

import { request } from "graphql-request";
import { gql } from "graphql-tag";

const GRAPH_API_ARGO =
  "https://backup.argofinance.money/subgraphs/name/argo/stakedArgonauts";
const GRAPH_API_ARGOPETZ =
  "https://graph.argofinance.money/subgraphs/name/argo/petz";

type Argonaut = {
  id: string;
  owner: string;
  lastStakedTime: number; // or Date if it's a Date object
  staking: boolean;
};

type User = {
  id: string;
  argonauts: Argonaut[];
};

const getArgonautsLeaderboard = async (): Promise<Map<string, number>> => {
  const argonautsCountsByOwner = new Map<string, number>();
  let hasMore = true;
  let skip = 0;
  const batchSize = 1000; // Number of records to fetch in each batch

  while (hasMore) {
    const response: {
      [x: string]: User[];
    } = await request(
      GRAPH_API_ARGO,
      gql`
        query getArgonautsLeaderboard($batchSize: Int!, $skip: Int!) {
          users(first: $batchSize, skip: $skip) {
            id
            argonauts {
              id
            }
          }
        }
      `,
      { batchSize, skip }
    );

    const users = response.users;
    users.forEach((user: any) => {
      if (user.argonauts.length > 0) {
        argonautsCountsByOwner.set(user.id, user.argonauts.length);
      }
    });

    if (users.length < batchSize) {
      hasMore = false;
    } else {
      skip += batchSize;
    }
  }
  return argonautsCountsByOwner;
};
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
const isEligible = async (walletAddress: string): Promise<boolean> => {
  // Change walletAddress to lowercase
  walletAddress = walletAddress.toLowerCase();
  const regularArgonautOwners = await getArgonautsLeaderboard();
  if (
    regularArgonautOwners.has(walletAddress) &&
    regularArgonautOwners.get(walletAddress)! > 0
  )
    return true;

  const petzOwners = await getArgoPetzLeaderboard();

  if (petzOwners.has(walletAddress) && petzOwners.get(walletAddress)! > 0)
    return true;

  return false;
};

export { isEligible };
