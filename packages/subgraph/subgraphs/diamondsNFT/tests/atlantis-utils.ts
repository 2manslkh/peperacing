import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { ExpeditionEnded, ExpeditionStarted, RewardsClaimed } from '../generated/Atlantis/Atlantis';

import { newMockEvent } from 'matchstick-as';

export function createExpeditionEndedEvent(user: Address, expeditionId: BigInt, timeEnded: BigInt): ExpeditionEnded {
  let expeditionEndedEvent = changetype<ExpeditionEnded>(newMockEvent());

  expeditionEndedEvent.parameters = new Array();

  expeditionEndedEvent.parameters.push(new ethereum.EventParam('user', ethereum.Value.fromAddress(user)));
  expeditionEndedEvent.parameters.push(
    new ethereum.EventParam('expeditionId', ethereum.Value.fromUnsignedBigInt(expeditionId))
  );
  expeditionEndedEvent.parameters.push(
    new ethereum.EventParam('timeEnded', ethereum.Value.fromUnsignedBigInt(timeEnded))
  );

  return expeditionEndedEvent;
}

export function createExpeditionStartedEvent(
  user: Address,
  planetId: i32,
  expeditionId: i32,
  tokenIds: i32[],
  collectionIds: Address[],
  startTime: i32,
  endTime: i32
): ExpeditionStarted {
  let newEvent = changetype<ExpeditionStarted>(newMockEvent());

  newEvent.parameters = [
    new ethereum.EventParam('user', ethereum.Value.fromAddress(user)),
    new ethereum.EventParam('planetId', ethereum.Value.fromI32(planetId)),
    new ethereum.EventParam('expeditionId', ethereum.Value.fromI32(expeditionId)),
    new ethereum.EventParam('tokenIds', ethereum.Value.fromI32Array(tokenIds)),
    new ethereum.EventParam('collectionIds', ethereum.Value.fromAddressArray(collectionIds)),
    new ethereum.EventParam('startTime', ethereum.Value.fromI32(startTime)),
    new ethereum.EventParam('endTime', ethereum.Value.fromI32(endTime)),
  ];

  return newEvent;
}

export function createRewardsClaimedEvent(
  user: Address,
  expeditionId: BigInt,
  gemstoneId: BigInt,
  gemstoneGenerated: BigInt,
  stardust: BigInt
): RewardsClaimed {
  let rewardsClaimedEvent = changetype<RewardsClaimed>(newMockEvent());

  rewardsClaimedEvent.parameters = new Array();

  rewardsClaimedEvent.parameters.push(new ethereum.EventParam('user', ethereum.Value.fromAddress(user)));
  rewardsClaimedEvent.parameters.push(
    new ethereum.EventParam('expeditionId', ethereum.Value.fromUnsignedBigInt(expeditionId))
  );
  rewardsClaimedEvent.parameters.push(
    new ethereum.EventParam('gemstoneId', ethereum.Value.fromUnsignedBigInt(gemstoneId))
  );
  rewardsClaimedEvent.parameters.push(
    new ethereum.EventParam('gemstoneGenerated', ethereum.Value.fromUnsignedBigInt(gemstoneGenerated))
  );
  rewardsClaimedEvent.parameters.push(new ethereum.EventParam('stardust', ethereum.Value.fromUnsignedBigInt(stardust)));

  return rewardsClaimedEvent;
}
