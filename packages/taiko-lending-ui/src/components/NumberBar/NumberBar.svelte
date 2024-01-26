<script lang="ts">
  import { breakpoints } from '../../styles/breakpoints';

  import { screen } from '$stores/responsiveness';

  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  const animatedWidth = tweened(0, {
    duration: 1000,
    easing: cubicOut,
  });

  export let value: number = 100;
  export let maxValue: number = 100;
  export let title: string = 'Title';

  $: $animatedWidth = (value / maxValue) * 100;
</script>

<container>
  <div class="number-bar-title">{title}</div>
  {#if $screen == 'desktop'}
    <div class="number-bar-container">
      <div class="number-bar" style="width: {$animatedWidth}%"></div>
    </div>
  {/if}
  <div class="number-bar-value">{value}</div>
</container>

<style lang="scss">
  @keyframes fillUp {
    from {
      width: 0px;
    }
    to {
      width: 50%;
    }
  }

  container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    width: 100%;
  }

  .number-bar-title {
    font-size: 1.5rem;
    font-weight: 500;
    color: $primary;
    word-break: keep-all;
    min-width: 240px;
    padding-right: 2rem;

    @media screen and (max-width: $large) {
      font-size: 1.5rem;
      min-width: 60px;
    }
  }

  .number-bar-value {
    font-size: 1.5rem;
    font-weight: 500;
    color: $primary;
    word-break: keep-all;
    padding-left: 4rem;
    min-width: 240px;

    @media screen and (max-width: 1024px) {
      min-width: 60px;
    }
  }

  .number-bar-container {
    width: 100%;
    background-color: #eee;
    border: 1px solid #ddd;
    border-radius: 100px;
    /* width: 700px; */
    max-width: 700px;
  }
  .number-bar {
    height: 20px;
    background-color: var(--primary-interactive);
    /* transition: width 0.3s ease; */
    /* animation: fillUp 1s ease-out forwards; */
    border-radius: 100px;
  }
</style>
