<script lang="ts">
  import FaucetItem from './FaucetItem.svelte';

  import { faucetConfig } from '../../configs/faucet';
  console.log(Object.values(faucetConfig));
</script>

<div class="flex flex-col w-2/3 gap-8">
  <div class="display-large-semibold">Faucet</div>
  <div class="flex flex-col shadow-2xl justify-center content-center rounded-lg p-4 gap-4">
    {#each Object.values(faucetConfig) as faucet}
      <FaucetItem data={faucet} />
    {/each}
  </div>
</div>
