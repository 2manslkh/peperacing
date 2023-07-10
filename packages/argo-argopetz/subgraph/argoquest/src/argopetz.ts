import { Transfer } from '../generated/ArgoPetz/ArgoPetz';
import { User, Petz } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';
export function handleTransfer(event: Transfer): void {
  const nullAddr = '0x0000000000000000000000000000000000000000';
  // If the token is being transferred from address 0, it's a mint
  if (event.params.from.toHexString() == nullAddr) {
    let pet = new Petz(event.params.id.toString());
    pet.owner = event.params.to.toHex();
    pet.lastStakedTime = BigInt.fromI32(0);
    pet.staking = false; // Initialize staking
    pet.save();
  }

  // If the token is being transferred to address 0, it's a burn
  else if (event.params.to.toHexString() == nullAddr) {
    let pet = Petz.load(event.params.id.toString());
    if (pet != null) {
      pet.owner = nullAddr;
      pet.save();
    }
  }

  // Otherwise, it's a regular transfer
  else {
    let pet = Petz.load(event.params.id.toString());
    if (pet != null) {
      pet.owner = event.params.to.toHex();
      pet.save();
    }
  }

  let user = User.load(event.params.to.toHex());
  if (user == null) {
    user = new User(event.params.to.toHex());
    user.argoPetz = [];
  }

  let petArray = user.argoPetz;
  petArray.push(event.params.id.toString());
  user.argoPetz = petArray;

  user.save();
}
