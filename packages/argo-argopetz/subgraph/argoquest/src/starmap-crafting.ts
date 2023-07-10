import { StakedNFT, UnstakedNFT } from '../generated/StarMapCrafting/StarMapCrafting';
import { User, Petz } from '../generated/schema';

export function handleStakedNFT(event: StakedNFT): void {
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
    user.argoPetz = [];
  }

  let pet = Petz.load(event.params.nftId.toString());
  if (pet == null) {
    pet = new Petz(event.params.nftId.toString());
    pet.owner = user.id;
    pet.lastStakedTime = event.params.startTime;
    pet.staking = true;
  } else {
    pet.lastStakedTime = event.params.startTime;
    pet.staking = true;
  }

  let userPetz = user.argoPetz;
  userPetz.push(pet.id);
  user.argoPetz = userPetz;

  user.save();
  pet.save();
}

export function handleUnstakedNFT(event: UnstakedNFT): void {
  let pet = Petz.load(event.params.nftId.toString());
  if (pet != null) {
    pet.staking = false;
    pet.save();
  }
}
