import type { MarketConfig, MarketData } from "$libs/market/types";

import TTKO_ICON from "../public/images/Coin=TTKOK.svg";
import USDC_ICON from "../public/images/Coin=USDC.svg";
import USDT_ICON from "../public/images/Coin=USDT.svg";
import WBTC_ICON from "../public/images/Coin=BTC.svg";
import WETH_ICON from "../public/images/Coin=ETH.svg";

export const markets: MarketConfig = {
    weth: {
        name: "WETH",
        symbol: "WETH",
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        decimals: 18,
        image: WETH_ICON
    },
    wbtc: {
        name: "WBTC",
        symbol: "WBTC",
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        decimals: 18,
        image: WBTC_ICON
    },
    usdc: {
        name: "USDC",
        symbol: "USDC",
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
        image: USDC_ICON,
    },
    usdt: {
        name: "USDT",
        symbol: "USDT",
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        decimals: 18,
        image: USDT_ICON
    },
    ttko: {
        name: "TTKO",
        symbol: "TTKO",
        address: "0x9f7229af1f638cdfb92c693cecdc7e8f108f61ea",
        decimals: 18,
        image: TTKO_ICON
    },
}

export const mockData: MarketData[] = [
    {
        name: "WETH",
        symbol: "WETH",
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        decimals: 18,
        image: WETH_ICON,
        supply: 1000,
        borrow: 500,
        utilization: 50,
        supplyApy: 5.8,
        borrowApy: 7.1,
        price: 2100,
    },
    {
        name: "WBTC",
        symbol: "WBTC",
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        decimals: 18,
        image: WBTC_ICON,
        supply: 200,
        borrow: 80,
        utilization: 40,
        supplyApy: 1.1,
        borrowApy: 2.1,
        price: 40000,
    },
    {
        name: "USDC",
        symbol: "USDC",
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
        image: USDC_ICON,
        supply: 10000000,
        borrow: 3000000,
        utilization: 30,
        supplyApy: 0.1,
        borrowApy: 0.1,
        price: 1,
    },
    {
        name: "USDT",
        symbol: "USDT",
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        decimals: 18,
        image: USDT_ICON,
        supply: 100000000,
        borrow: 99000000,
        utilization: 99,
        supplyApy: 0.1,
        borrowApy: 0.1,
        price: 1,
    },
    {
        name: "TTKO",
        symbol: "TTKO",
        address: "0x9f7229af1f638cdfb92c693cecdc7e8f108f61ea",
        decimals: 18,
        image: TTKO_ICON,
        supply: 100000,
        borrow: 500,
        utilization: 5,
        supplyApy: 0.1,
        borrowApy: 0.1,
        price: 10,
    },
]
