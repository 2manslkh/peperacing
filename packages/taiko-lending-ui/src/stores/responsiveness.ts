import type { ScreenMode } from "../types";
import { writable } from "svelte/store";

export let screenSize = writable<number>(0);
export let screen = writable<ScreenMode>("desktop");