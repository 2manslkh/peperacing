<script lang="ts">
  import type { MarketData } from '$libs/market/types';

  export let modalOpen: boolean = false;
  export let market: MarketData;
</script>

{#if modalOpen}
  <dialog class="modal" class:modal-open={modalOpen}>
    <div class="modal-box max-w-sm">
      <form method="dialog" class="flex flex-col w-full items-center gap-4">
        <button on:click={() => (modalOpen = false)} class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >✕</button>

        <div class="title-subsection-bold">Borrow {market.name}</div>
        <div class="divider m-0"></div>

        <div class="flex justify-between w-full gap-4">
          <div class="body-regular">Enable Collateral</div>
          <input type="checkbox" class="toggle toggle-primary" />
        </div>

        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">Available Balance:</span>
            <span class="label-text-alt">10.00 {market.name}</span>
          </div>
          <input type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
          <div class="label"></div>
        </label>

        <div class="grid grid-cols-2 w-full gap-1">
          <div class="body-regular text-left">Supply APY</div>
          <div class="body-regular">{market.supplyApy}</div>
          <div class="body-regular text-left">Distribution APY</div>
          <div class="body-regular">42%</div>
          <div class="body-regular text-left">Supply Balance:</div>
          <div class="body-regular">{'0.00 -> 100'}</div>
          <div class="body-regular text-left">Borrow Limit:</div>
          <div class="body-regular">$1000</div>
          <div class="body-regular text-left">Loan-to-value</div>
          <div class="body-regular">0%</div>
        </div>
        <button class="btn btn-primary rounded-lg body-semibold text-white bg-pink-500 py-2 px-8">Borrow</button>
      </form>
    </div>
  </dialog>
{/if}
