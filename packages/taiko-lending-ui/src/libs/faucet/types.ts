export type FaucetData = {
    name?: string;
    symbol: string;
    address?: string;
    decimals?: number;
    image: string;
    supply: number;
    borrow: number;
    utilization: number;
    supplyApy: number;
    borrowApy: number;
    price: number;
}

export type Faucet = {
    name: string;
    symbol: string;
    address: string;
    faucetAddress: string;
    amount: bigint;
    image: string;
}

export type FaucetConfig = {
    [key: string]: Faucet
}