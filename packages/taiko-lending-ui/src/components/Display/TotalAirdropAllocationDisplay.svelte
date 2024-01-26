<script lang="ts">
  import { onMount } from 'svelte';
  import SectionContainer from '../Container/SectionContainer.svelte';
  import { spring } from 'svelte/motion';

  let totalAllocation: number = 9000;

  $: display = spring(0, {
    precision: 0.01,
    damping: 1,
    stiffness: 0.09,
  });

  onMount(() => {
    display.set(totalAllocation);
  });

  function handle() {
    display.set(1000 * Math.random());
  }
</script>

<SectionContainer>
  <total-airdrop-allocation>
    <div class="callout-b title">Total Airdrop Allocation</div>
    <div class="d-lg-sb" on:click={handle}>{$display.toFixed(2)} TKO</div>
  </total-airdrop-allocation>
</SectionContainer>

<style lang="scss">
  total-airdrop-allocation {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .title {
    width: auto;

    padding-bottom: 1rem;

    color: var(--primary-interactive);
  }

  .value {
    width: auto;

    font-weight: 700;
    font-size: 4rem;
    line-height: 54px;
    display: flex;
    align-items: center;
    text-align: center;
    color: $primary;
  }
</style>
