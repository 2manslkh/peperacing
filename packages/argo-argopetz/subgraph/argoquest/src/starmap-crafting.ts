import { BigInt } from '@graphprotocol/graph-ts';
import {
  StarMapCrafting,
  StakedNFT,
  UnstakedNFT,
  StarmapCraftingTimeSet,
} from '../generated/StarMapCrafting/StarMapCrafting';
import { Staked, Unstaked } from '../generated/schema';

export function handleStakedNFT(event: StakedNFT): void {
  let entity = new Staked(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.user = event.params.user;
  entity.nftId = event.params.nftId;
  entity.startTime = event.params.startTime;

  entity.save();
}

export function handleUnstakedNFT(event: UnstakedNFT): void {
  let entity = new Unstaked(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.user = event.params.user;
  entity.nftId = event.params.nftId;
  entity.unstakeTime = event.params.unstakeTime;

  entity.save();
}
