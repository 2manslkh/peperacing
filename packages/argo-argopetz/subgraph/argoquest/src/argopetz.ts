import { Transfer } from '../generated/ArgoPetz/ArgoPetz';
import { User, Petz } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';
export function handleTransfer(event: Transfer): void {
  const nullAddr = '0x0000000000000000000000000000000000000000';
  const starmapAddr = '0xc377748f64a437520D43b4A17446b0fB8423a030';
  const argoQuestAddr = '0x05ab185d3c8A5b8E00ae1a5C02487e6d85E9CD1D';
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
  } else if (
    event.params.to.toHexString().toLowerCase() == starmapAddr.toLowerCase() ||
    event.params.to.toHexString().toLowerCase() == argoQuestAddr.toLowerCase()
  ) {
    let pet = Petz.load(event.params.id.toString());
    if (pet != null) {
      pet.owner = event.params.from.toHexString();
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
