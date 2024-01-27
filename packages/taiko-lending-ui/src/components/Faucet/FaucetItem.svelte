<script lang="ts">
  import type { Faucet } from '$libs/faucet/types';
  import { formatEther } from 'viem';

  function handleDripOnClick() {
    console.log('Drip Clicked');
    console.log(data.amount, data.symbol);
    isLoading = !isLoading;
  }

  export let data: Faucet;
  let isLoading: boolean = false;
</script>

<div class="flex gap-8 justify-between">
  <div class="flex gap-4 items-center">
    <img src={data.image} alt="asset_icon" />
    <div class="body-medium">{data.symbol}</div>
  </div>
  <button on:click={handleDripOnClick} class="btn btn-primary moving-gradient w-48 text-white">
    {#if isLoading}
      <span class="loading loading-spinner"></span>
    {:else}
      Drip {formatEther(data.amount)} {data.symbol}
    {/if}
  </button>
</div>
