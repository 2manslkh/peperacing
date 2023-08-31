import { BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/Argonauts/Argonauts";
import { User, Argonauts } from "../generated/schema";

const stakingAddresses: string[] = [
  "0xc8432607e92eb1293334682dfae7ff2e35ecac31",
  "0x2d326c0be04f1e3c6dd95e70323ea047fd49fe9d",
  "0x073a282bc85891627300106f8d7986899d9eeb40",
  "0x8efc3584edcb45f8b0367fd37c65Fa498c461b5b",
];

export function handleTransfer(event: Transfer): void {
  let argonautId = event.params.id;
  let fromAddress = event.params.from;
  let toAddress = event.params.to;

  // Ensure the receiving User exists
  let toUser = User.load(toAddress.toHexString());
  if (!toUser) {
    toUser = new User(toAddress.toHexString());
    toUser.save();
  }

  // Fetch or create the Argonauts entity
  let argonaut = Argonauts.load(argonautId.toString());
  if (!argonaut) {
    argonaut = new Argonauts(argonautId.toString());
  }

  // If transferred to staking, just mark it staked, but the owner remains
  if (stakingAddresses.includes(toAddress.toHexString().toLowerCase())) {
    argonaut.staking = true;
  } else {
    argonaut.staking = false;
    argonaut.owner = toUser.id; // Update owner
  }

  argonaut.save();
}
