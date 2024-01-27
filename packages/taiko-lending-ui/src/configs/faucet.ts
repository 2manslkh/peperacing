import type { FaucetConfig } from "$libs/faucet/types";
import TTKO_ICON from "../public/images/Coin=TTKOK.svg";
import USDC_ICON from "../public/images/Coin=USDC.svg";
import USDT_ICON from "../public/images/Coin=USDT.svg";
import WBTC_ICON from "../public/images/Coin=BTC.svg";
import { parseEther } from "viem";

export const faucetConfig: FaucetConfig = {
    wbtc: {
        name: "WBTC",
        symbol: "WBTC",
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        faucetAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        image: WBTC_ICON,
        amount: parseEther("0.01")
    },
    usdc: {
        name: "USDC",
        symbol: "USDC",
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        faucetAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        image: USDC_ICON,
        amount: parseEther("10")
    },
    usdt: {
        name: "USDT",
        symbol: "USDT",
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        faucetAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        image: USDT_ICON,
        amount: parseEther("10")
    },
    ttko: {
        name: "TTKO",
        symbol: "TTKO",
        address: "0x9f7229af1f638cdfb92c693cecdc7e8f108f61ea",
        faucetAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        image: TTKO_ICON,
        amount: parseEther("0.10")
    },
}
