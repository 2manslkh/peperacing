import { newMockEvent } from 'matchstick-as';
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts';
import { StakedNFT, UnstakedNFT } from '../generated/StarMapCrafting/StarMapCrafting';

export function createStakedNFTEvent(user: Address, nftId: BigInt, startTime: BigInt): StakedNFT {
  let stakedNFTEvent = changetype<StakedNFT>(newMockEvent());

  stakedNFTEvent.parameters = new Array();

  stakedNFTEvent.parameters.push(new ethereum.EventParam('user', ethereum.Value.fromAddress(user)));
  stakedNFTEvent.parameters.push(new ethereum.EventParam('nftId', ethereum.Value.fromUnsignedBigInt(nftId)));
  stakedNFTEvent.parameters.push(new ethereum.EventParam('startTime', ethereum.Value.fromUnsignedBigInt(startTime)));

  return stakedNFTEvent;
}

export function createUnstakedNFTEvent(user: Address, nftId: BigInt, unstakeTime: BigInt): UnstakedNFT {
  let unstakedNFTEvent = changetype<UnstakedNFT>(newMockEvent());

  unstakedNFTEvent.parameters = new Array();

  unstakedNFTEvent.parameters.push(new ethereum.EventParam('user', ethereum.Value.fromAddress(user)));
  unstakedNFTEvent.parameters.push(new ethereum.EventParam('nftId', ethereum.Value.fromUnsignedBigInt(nftId)));
  unstakedNFTEvent.parameters.push(
    new ethereum.EventParam('unstakeTime', ethereum.Value.fromUnsignedBigInt(unstakeTime))
  );

  return unstakedNFTEvent;
}
