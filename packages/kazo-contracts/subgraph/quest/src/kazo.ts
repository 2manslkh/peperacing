import { Transfer } from '../generated/Kazo/Kazo';
import { User, Kazo } from '../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';
export function handleTransfer(event: Transfer): void {
  const nullAddr = '0x0000000000000000000000000000000000000000';
  // Get starmap and argoquest addresses from networks.json

  const stakingAddr = '0xE48C9E09119D8Dce47A66975CE441e49f407def2';
  const questAddr = '0x61303936E734cd87DDBBC5B677B7b3097b91a11d';

  // If the token is being transferred from address 0, it's a mint
  if (event.params.from.toHexString() == nullAddr) {
    let kazo = new Kazo(event.params.id.toString());
    kazo.owner = event.params.to.toHex();
    kazo.lastStakedTime = BigInt.fromI32(0);
    kazo.staking = false; // Initialize staking
    kazo.save();
  }

  // If the token is being transferred to address 0, it's a burn
  else if (event.params.to.toHexString() == nullAddr) {
    let kazo = Kazo.load(event.params.id.toString());
    if (kazo != null) {
      kazo.owner = nullAddr;
      kazo.save();
    }
  } else if (
    event.params.to.toHexString().toLowerCase() == stakingAddr.toLowerCase() ||
    event.params.to.toHexString().toLowerCase() == questAddr.toLowerCase()
  ) {
    let kazo = Kazo.load(event.params.id.toString());
    if (kazo != null) {
      kazo.owner = event.params.from.toHexString();
      kazo.save();
    }
  }

  // Otherwise, it's a regular transfer
  else {
    let kazo = Kazo.load(event.params.id.toString());
    if (kazo != null) {
      kazo.owner = event.params.to.toHex();
      kazo.save();
    }
  }

  let user = User.load(event.params.to.toHex());
  if (user == null) {
    user = new User(event.params.to.toHex());
  }

  user.save();
}
