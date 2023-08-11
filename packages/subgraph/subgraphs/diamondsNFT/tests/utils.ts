import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import {
  ItemCanceled,
  ItemListed,
  ItemSold,
  ItemUpdated,
  UpdateCollectionOwnerFee,
} from '../generated/Atlantis Marketplace/AtlantisMarketplace';
import { TransferBatch, TransferSingle } from '../generated/Atlantis Marketplace/ERC1155';

import { ATLANTIS_MARKETPLACE_ADDRESS } from '@atlantis/constants';
import { Transfer } from '../generated/Argonauts/ERC721';
import { newMockEvent } from 'matchstick-as';

export const MARKETPLACE_BUYER_ADDRESS = '0x99193EE9229b833d2aA4DbBdA697C6600b944286';

export const createItemCanceledEvent = (user: string, contract: Address, tokenId: i32): ItemCanceled => {
  const newEvent = changetype<ItemCanceled>(newMockEvent());
  newEvent.address = ATLANTIS_MARKETPLACE_ADDRESS;
  newEvent.parameters = [
    new ethereum.EventParam('seller', ethereum.Value.fromAddress(Address.fromString(user))),
    new ethereum.EventParam('nftAddress', ethereum.Value.fromAddress(contract)),
    new ethereum.EventParam('tokenId', ethereum.Value.fromI32(tokenId)),
  ];

  return newEvent;
};

export const createItemListedEvent = (
  user: string,
  contract: Address,
  tokenId: i32,
  quantity: i32,
  price: i32,
  expires: i32 = 1656403681,
  timestamp: i32 = expires
): ItemListed => {
  const newEvent = changetype<ItemListed>(newMockEvent());
  newEvent.address = ATLANTIS_MARKETPLACE_ADDRESS;
  newEvent.block.timestamp = BigInt.fromI32(timestamp);
  newEvent.parameters = [
    new ethereum.EventParam('seller', ethereum.Value.fromAddress(Address.fromString(user))),
    new ethereum.EventParam('nftAddress', ethereum.Value.fromAddress(contract)),
    new ethereum.EventParam('tokenId', ethereum.Value.fromI32(tokenId)),
    new ethereum.EventParam('quantity', ethereum.Value.fromI32(quantity)),
    new ethereum.EventParam('pricePerItem', ethereum.Value.fromI32(price)),
    new ethereum.EventParam('expirationTime', ethereum.Value.fromI32(expires)),
  ];

  return newEvent;
};

export const createItemSoldEvent = (
  seller: string,
  buyer: string,
  contract: Address,
  tokenId: i32,
  quantity: i32,
  price: i32
): ItemSold => {
  const newEvent = changetype<ItemSold>(newMockEvent());
  newEvent.address = ATLANTIS_MARKETPLACE_ADDRESS;
  newEvent.transaction.from = Address.fromString(buyer);
  newEvent.parameters = [
    new ethereum.EventParam('seller', ethereum.Value.fromAddress(Address.fromString(seller))),
    new ethereum.EventParam('buyer', ethereum.Value.fromAddress(Address.fromString(buyer))),
    new ethereum.EventParam('nftAddress', ethereum.Value.fromAddress(contract)),
    new ethereum.EventParam('tokenId', ethereum.Value.fromI32(tokenId)),
    new ethereum.EventParam('quantity', ethereum.Value.fromI32(quantity)),
    new ethereum.EventParam('pricePerItem', ethereum.Value.fromI32(price)),
  ];

  return newEvent;
};

export const createItemUpdatedEvent = (
  user: string,
  contract: Address,
  tokenId: i32,
  quantity: i32,
  price: i32,
  expires: i32 = 1656403681,
  timestamp: i32 = expires
): ItemUpdated => {
  const newEvent = changetype<ItemUpdated>(newMockEvent());
  newEvent.address = ATLANTIS_MARKETPLACE_ADDRESS;
  newEvent.block.timestamp = BigInt.fromI32(timestamp);
  newEvent.parameters = [
    new ethereum.EventParam('seller', ethereum.Value.fromAddress(Address.fromString(user))),
    new ethereum.EventParam('nftAddress', ethereum.Value.fromAddress(contract)),
    new ethereum.EventParam('tokenId', ethereum.Value.fromI32(tokenId)),
    new ethereum.EventParam('quantity', ethereum.Value.fromI32(quantity)),
    new ethereum.EventParam('pricePerItem', ethereum.Value.fromI32(price)),
    new ethereum.EventParam('expirationTime', ethereum.Value.fromI32(expires)),
  ];

  return newEvent;
};

export const createTransferEvent = (contract: Address, from: string, to: string, tokenId: i32): Transfer => {
  const newEvent = changetype<Transfer>(newMockEvent());
  newEvent.address = contract;
  newEvent.parameters = [
    new ethereum.EventParam('from', ethereum.Value.fromAddress(Address.fromString(from))),
    new ethereum.EventParam('to', ethereum.Value.fromAddress(Address.fromString(to))),
    new ethereum.EventParam('tokenId', ethereum.Value.fromI32(tokenId)),
  ];

  return newEvent;
};

export const createTransferBatchEvent = (
  contract: Address,
  from: string,
  to: string,
  tokenIds: i32[],
  quantities: i32[],
  operator: Address = contract
): TransferBatch => {
  const newEvent = changetype<TransferBatch>(newMockEvent());
  newEvent.address = contract;
  newEvent.parameters = [
    new ethereum.EventParam('operator', ethereum.Value.fromAddress(operator)),
    new ethereum.EventParam('from', ethereum.Value.fromAddress(Address.fromString(from))),
    new ethereum.EventParam('to', ethereum.Value.fromAddress(Address.fromString(to))),
    new ethereum.EventParam('ids', ethereum.Value.fromI32Array(tokenIds)),
    new ethereum.EventParam('values', ethereum.Value.fromI32Array(quantities)),
  ];

  return newEvent;
};

export const createTransferSingleEvent = (
  contract: Address,
  from: string,
  to: string,
  tokenId: i32,
  quantity: i32 = 1,
  operator: Address = contract
): TransferSingle => {
  const newEvent = changetype<TransferSingle>(newMockEvent());
  newEvent.address = contract;
  newEvent.parameters = [
    new ethereum.EventParam('operator', ethereum.Value.fromAddress(operator)),
    new ethereum.EventParam('from', ethereum.Value.fromAddress(Address.fromString(from))),
    new ethereum.EventParam('to', ethereum.Value.fromAddress(Address.fromString(to))),
    new ethereum.EventParam('id', ethereum.Value.fromI32(tokenId)),
    new ethereum.EventParam('value', ethereum.Value.fromI32(quantity)),
  ];

  return newEvent;
};

export const createUpdateCollectionOwnerFee = (collection: Address, fee: i32): UpdateCollectionOwnerFee => {
  const newEvent = changetype<UpdateCollectionOwnerFee>(newMockEvent());

  newEvent.address = ATLANTIS_MARKETPLACE_ADDRESS;
  newEvent.parameters = [
    new ethereum.EventParam('collection', ethereum.Value.fromAddress(collection)),
    new ethereum.EventParam('recipient', ethereum.Value.fromAddress(Address.zero())),
    new ethereum.EventParam('fee', ethereum.Value.fromI32(fee)),
  ];

  return newEvent;
};
