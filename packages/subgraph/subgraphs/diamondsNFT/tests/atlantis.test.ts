import { Address, BigInt } from '@graphprotocol/graph-ts';
import { afterAll, assert, beforeAll, clearStore, countEntities, describe, log, logStore, test } from 'matchstick-as';
import { createExpeditionEndedEvent, createExpeditionStartedEvent } from './atlantis-utils';
import { handleExpeditionEnded, handleExpeditionStarted } from '../src/mappings/atlantis';

import { ATLANTIS_ADDRESS } from '@atlantis/constants';
import { ExpeditionEnded as ExpeditionEndedEvent } from '../generated/Atlantis/Atlantis';

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe('Atlantis', () => {
  beforeAll(() => {
    // handleExpeditionStarted(newExpedition);
    // logStore();
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test
  test('ExpeditionStarted', () => {
    // Mint Token

    let user = Address.fromString('0x0000000000000000000000000000000000000001');
    let planetId = 1;
    let expeditionId = 1;
    let timeStarted = 1;
    let timeEnded = 2;
    let newExpedition = createExpeditionStartedEvent(user, planetId, expeditionId, [], [], timeStarted, timeEnded);
    handleExpeditionStarted(newExpedition);
    // logStore();
  });

  test('#id', () => {
    assert.fieldEquals('Expedition', '0x1', 'id', '0x1');
  });
  test('#user', () => {
    assert.fieldEquals('Expedition', '0x1', 'user', '0x0000000000000000000000000000000000000001');
  });
  test('#expeditionId', () => {
    assert.fieldEquals('Expedition', '0x1', 'expeditionId', '1');
  });
  test('#endTime', () => {
    assert.fieldEquals('Expedition', '0x1', 'endTime', '2');
  });
  test('#collectionIds', () => {
    assert.fieldEquals('Expedition', '0x1', 'collectionIds', '[]');
  });
  test('#startTime', () => {
    assert.fieldEquals('Expedition', '0x1', 'startTime', '1');
  });
  test('#planetId', () => {
    assert.fieldEquals('Expedition', '0x1', 'planetId', '1');
  });
  test('#tokenIds', () => {
    assert.fieldEquals('Expedition', '0x1', 'tokenIds', '[]');
  });
  test('#ongoing', () => {
    assert.fieldEquals('Expedition', '0x1', 'ongoing', 'true');
  });
});
