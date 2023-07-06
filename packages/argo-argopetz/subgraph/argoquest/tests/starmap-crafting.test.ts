import { assert, describe, test, clearStore, beforeAll, afterAll } from 'matchstick-as/assembly/index';
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Staked, Unstaked } from '../generated/schema';
import {
  StakedNFT as StakedNFTEvent,
  UnstakedNFT as UnstakedNFTEvent,
} from '../generated/StarMapCrafting/StarMapCrafting';
import { handleStakedNFT, handleUnstakedNFT } from '../src/starmap';
import { createStakedNFTEvent, createUnstakedNFTEvent } from './starmap-utils';

describe('StarMapCrafting Subgraph', () => {
  beforeAll(() => {
    let user = Address.fromString('0x0000000000000000000000000000000000000001');
    let nftId = BigInt.fromI32(1);
    let timestamp = BigInt.fromI32(1625143700);

    let stakedNFTEvent = createStakedNFTEvent(user, nftId, timestamp);
    handleStakedNFT(stakedNFTEvent);

    let unstakedNFTEvent = createUnstakedNFTEvent(user, nftId, timestamp);
    handleUnstakedNFT(unstakedNFTEvent);
  });

  afterAll(() => {
    clearStore();
  });

  test('StakedNFT created and stored', () => {
    assert.entityCount('Staked', 1);

    assert.fieldEquals(
      'Staked',
      '0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1',
      'user',
      '0x0000000000000000000000000000000000000001'
    );
    assert.fieldEquals('Staked', '0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1', 'nftId', '1');
    assert.fieldEquals('Staked', '0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1', 'startTime', '1625143700');
  });

  test('UnstakedNFT created and stored', () => {
    assert.entityCount('Unstaked', 1);

    assert.fieldEquals(
      'Unstaked',
      '0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1',
      'user',
      '0x0000000000000000000000000000000000000001'
    );
    assert.fieldEquals('Unstaked', '0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1', 'nftId', '1');
    assert.fieldEquals('Unstaked', '0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1', 'unstakeTime', '1625143700');
  });
});
