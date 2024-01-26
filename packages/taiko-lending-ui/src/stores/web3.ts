import { readable, writable } from "svelte/store";

import type { GetAccountResult } from "@wagmi/core";
import type { Web3Modal } from "@web3modal/wagmi/dist/types/src/client";

export const wagmiClient = writable();
export const account = writable<GetAccountResult>();
export const web3Modal = writable<Web3Modal>();