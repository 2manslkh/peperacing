import { StakedNFT, UnstakedNFT } from '../generated/KazoStaking/KazoStaking';
import { User, Kazo } from '../generated/schema';

export function handleStakedNFT(event: StakedNFT): void {
  let user = User.load(event.params.user.toHex());
  if (user == null) {
    user = new User(event.params.user.toHex());
  }

  let kazo = Kazo.load(event.params.nftId.toString());
  if (kazo == null) {
    kazo = new Kazo(event.params.nftId.toString());
    kazo.owner = user.id;
    kazo.lastStakedTime = event.params.startTime;
    kazo.staking = true;
  } else {
    kazo.lastStakedTime = event.params.startTime;
    kazo.staking = true;
  }

  user.save();
  kazo.save();
}

export function handleUnstakedNFT(event: UnstakedNFT): void {
  let kazo = Kazo.load(event.params.nftId.toString());
  if (kazo != null) {
    kazo.staking = false;
    kazo.save();
  }
}
