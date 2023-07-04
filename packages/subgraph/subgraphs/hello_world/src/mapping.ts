import { Address, BigInt, TypedMap, store } from '@graphprotocol/graph-ts';
import { Deposit, User, Withdrawal } from '../generated/schema';
import { Deposited, Withdrawn } from '../generated/TestContract/TestContract';

export function handleDeposit(event: Deposited): void {
  let user = User.load(event.params.user.toHexString());
  if (user == null) {
    user = new User(event.params.user.toHexString());
    user.balance = BigInt.fromI32(0);
  }

  user.balance = user.balance.plus(event.params.amount);
  user.save();

  let deposit = new Deposit(event.transaction.hash.toHexString());
  deposit.user = user.id;
  deposit.amount = event.params.amount;
  deposit.save();
}

export function handleWithdraw(event: Withdrawn): void {
  let user = User.load(event.params.user.toHexString());
  if (user == null) {
    user = new User(event.params.user.toHexString());
    user.balance = BigInt.fromI32(0);
  }

  user.balance = user.balance.minus(event.params.amount);
  user.save();

  let withdrawal = new Withdrawal(event.transaction.hash.toHexString());
  withdrawal.user = user.id;
  withdrawal.amount = event.params.amount;
  withdrawal.save();
}