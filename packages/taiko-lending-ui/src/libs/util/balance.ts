import { type FetchBalanceResult, getAccount, getPublicClient } from '@wagmi/core';
import { formatEther } from 'viem';

import { truncateString } from '$libs/util/truncateString';

export function renderBalance(balance: Maybe<FetchBalanceResult | bigint>) {
  if (!balance) return '0.00';
  if (typeof balance === 'bigint') return balance.toString();
  const maxlength = Number(balance.formatted) < 0.000001 ? balance.decimals : 6;
  return `${truncateString(balance.formatted, maxlength, '')} ${balance.symbol}`;
}

export function renderEthBalance(balance: bigint, maxlength = 8): string {
  return `${truncateString(formatEther(balance).toString(), maxlength, '')} ETH`;
}


export function renderCurrency(
  number: number,
  currencySymbol: string = '$',
  places: number = 2,
  sep: string = ',',
  dp: string = '.',
  pos: string = '',
  neg: string = '-',
  trailneg: string = '',
  symbolBefore: boolean = true
): string {
  if (isNaN(number)) {
    throw new Error("Number must be a valid number");
  }

  const sign = number < 0 ? neg : pos;
  const num = Math.abs(number);
  const whole = Math.trunc(num).toString();
  const fraction = num.toFixed(places).split('.')[1];

  // Split whole number into groups of three digits
  let wholeWithSep = '';
  for (let i = whole.length; i > 0; i -= 3) {
    wholeWithSep = whole.slice(Math.max(i - 3, 0), i) + (wholeWithSep ? sep + wholeWithSep : '');
  }

  // Construct the formatted currency string
  const formattedCurrency = `${sign}${symbolBefore ? currencySymbol : ''}${wholeWithSep}${dp}${fraction}${!symbolBefore ? currencySymbol : ''}${trailneg}`;

  return formattedCurrency;
}


export const refreshUserBalance = async () => {
  const account = getAccount();
  let balance = BigInt(0);
  if (account?.address) {
    balance = await getPublicClient().getBalance({ address: account.address });
  }
  ethBalance.set(balance);
};
