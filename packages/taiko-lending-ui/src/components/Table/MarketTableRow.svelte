<script lang="ts">
  import { BorrowModal } from '$components/Modal/BorrowModal';
  import { SupplyModal } from '$components/Modal/SupplyModal';
  import type { MarketData } from '$libs/market/types';
  import { renderCurrency } from '$libs/util/balance';
  export let market: MarketData;
  export let handleBorrowOnClick: () => void = () => {
    console.log('Borrow Clicked');
    isBorrowModalOpen = true;
  };
  export let handleSupplyOnClick: () => void = () => {
    console.log('Supply Clicked');
    isSupplyModalOpen = true;
  };

  let isBorrowModalOpen: boolean = false;
  let isSupplyModalOpen: boolean = false;
</script>

<tr class="border-b align-middle h-20 items-center justify-center">
  <td class="px-6 py-2">
    <!-- Icon and Text -->
    <div class="flex gap-4">
      <img src={market.image} alt="asset_icon" />
      <div class="body-medium place-self-center">{market.symbol}</div>
    </div>
  </td>
  <!-- Total Supply Data -->
  <td class="px-6 py-2">
    <div class="f-center flex-col">
      <div class="body-medium text-center">{renderCurrency(market.supply, '')}</div>
      <div class="body-small-light text-center">{renderCurrency(market.supply * market.price)}</div>
    </div>
  </td>
  <td class="px-6 py-2">
    <!-- Total Borrow Data -->
    <div class="f-center flex-col">
      <div class="body-medium text-center">{renderCurrency(market.borrow, '')}</div>
      <div class="body-small-light text-center">{renderCurrency(market.borrow * market.price)}</div>
    </div>
  </td>
  <td class="px-6 py-2">
    <!-- Utilisation Progress Bar -->
    <div class="f-center flex-col gap-1">
      <div class="body-medium text-center">{market.utilization}%</div>
      <progress class="progress progress-secondary bg-gray-300 w-36" value={market.utilization} max="100"></progress>
    </div>
  </td>
  <td class="px-6 py-2">
    <!-- Supply APY Data -->
    <div class="flex justify-between gap-4">
      <div class="f-center flex-col">
        <div class="body-small-bold text-center">{market.supplyApy}%</div>
        <div class="body-small-light text-center">{market.supplyApy}%</div>
      </div>
      <button
        on:click={handleSupplyOnClick}
        class="btn btn-primary rounded-lg body-semibold text-white bg-pink-500 py-2 px-4">Supply</button>
      <SupplyModal bind:modalOpen={isSupplyModalOpen} {market} />
    </div>
  </td>
  <td class="px-6 py-2">
    <!-- Borrow APY Data -->
    <div class="flex justify-between gap-4">
      <div class="f-center flex-col">
        <div class="body-small-bold text-center">{market.borrowApy}%</div>
        <div class="body-small-light text-center">{market.borrowApy}%</div>
      </div>
      <button
        on:click={handleBorrowOnClick}
        class="btn btn-primary rounded-lg body-semibold text-white bg-pink-500 py-2 px-4">Borrow</button>
      <BorrowModal bind:modalOpen={isBorrowModalOpen} {market} />
    </div>
  </td>
</tr>
