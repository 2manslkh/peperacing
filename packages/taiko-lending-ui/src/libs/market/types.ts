export type MarketData = {
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

export type Market = {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    image: string;
}

export type MarketConfig = {
    [key: string]: Market
}