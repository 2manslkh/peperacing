<script lang="ts">
  import MarketTableRow from './MarketTableRow.svelte';
  import { mockData } from '../../configs/market';
  import { screen } from '$stores/responsiveness';
</script>

<div class="shadow-2xl rounded-xl w-full h-full my-8 p-4 items-center justify-center content-center">
  {#if $screen == 'desktop'}
    <table class="w-full">
      <thead class="table-header">
        <tr class="border-b">
          <th class="px-6 pb-3">Market</th>
          <th class="px-6 pb-3">Total Supply</th>
          <th class="px-6 pb-3">Total Borrow</th>
          <th class="px-6 pb-3">Utilisation</th>
          <th class="px-6 pb-3">Supply APY</th>
          <th class="px-6 pb-3">Borrow APY</th>
        </tr>
      </thead>
      <tbody>
        <!-- Repeat this tr for each row -->
        {#each mockData as marketData}
          <MarketTableRow market={marketData} />
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="display-large-semibold">Markets</div>
    <div class="flex flex-col w-full gap-8">
      <div class="divider"></div>
      {#each mockData as marketData}
        <MarketTableRow market={marketData} />
      {/each}
    </div>
  {/if}
</div>
