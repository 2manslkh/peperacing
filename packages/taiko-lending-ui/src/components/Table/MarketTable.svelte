<script lang="ts">
  import MarketTableRow from './MarketTableRow.svelte';

  import { mockData } from '../../configs/market';
  import { BorrowModal } from '$components/Modal/BorrowModal';
  import { SupplyModal } from '$components/Modal/SupplyModal';
  import type { MarketData } from '$libs/market/types';

  let isBorrowModalOpen: boolean = false;
  let isSupplyModalOpen: boolean = false;
  let selectedMarket: MarketData = mockData[0];

  function handleBorrowOnClick(market: MarketData) {
    selectedMarket = market;
    isBorrowModalOpen = true;
  }

  function handleSupplyOnClick(market: MarketData) {
    selectedMarket = market;
    isSupplyModalOpen = true;
  }
</script>

<div class="shadow-2xl rounded-xl w-full h-full my-8 p-4 text-center border grid">
  <table class="min-w-full">
    <thead class="table-header">
      <tr class="border-b">
        <th class="px-6 py-3">Market</th>
        <th class="px-6 py-3">Total Supply</th>
        <th class="px-6 py-3">Total Borrow</th>
        <th class="px-6 py-3">Utilisation</th>
        <th class="px-6 py-3">Supply APY</th>
        <th class="px-6 py-3">Borrow APY</th>
      </tr>
    </thead>
    <tbody>
      <!-- Repeat this tr for each row -->
      {#each mockData as marketData}
        <MarketTableRow market={marketData} />
      {/each}
    </tbody>
  </table>
</div>
