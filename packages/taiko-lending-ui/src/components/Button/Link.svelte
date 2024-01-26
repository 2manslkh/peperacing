<script lang="ts">
  import { spring } from 'svelte/motion';
  import RightArrowIcon from '../../public/images/arrow-right.svg';

  $: arrowMovement = spring();
  export let buttonText = 'Link';
  export let hasArrow: boolean = true;
  export let url: string = '#';

  function handleHover() {
    arrowMovement.set(10);
  }

  function handleHoverExit() {
    arrowMovement.set(0);
  }
</script>

<a href={url} target="_blank" on:mouseenter={handleHover} on:mouseleave={handleHoverExit}>
  <div class="button-text">{buttonText}</div>
  {#if hasArrow}
    <div class="arrow-container" style="transform: translate({$arrowMovement}%, 0%)">
      <img src={RightArrowIcon} alt="arrow" width="14px" height="14px" />
    </div>
  {/if}
</a>

<style lang="scss">
  a {
    box-sizing: border-box;

    display: flex;
    flex-direction: row;
    justify-content: center;
    text-align: center;

    align-items: center;
    margin: auto;

    padding: 1rem 0.5rem 1rem 0.5rem;

    position: relative;

    width: 100%;
    height: 40px;

    background: none;
    border: 1px var(--primary-interactive) solid;
    border-radius: 1000px;
    cursor: pointer;

    text-decoration: none;
  }

  a::before {
    content: '';
    margin-right: auto; /* This will push the first real child to the center */
  }

  a::after {
    content: '';
    margin-left: auto; /* This will push the second child to the right */
  }

  .button-text {
    font-style: normal;
    font-weight: 500;
    font-size: 1rem;
    display: flex;
    position: relative;
    align-items: center;
    text-align: center;
    align-self: center;

    color: $primary;
    /* Inside auto layout */

    order: 0;
  }

  .arrow-container {
    position: relative;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    width: 32px;
    height: 32px;
    border-radius: 50%;

    /* Inside auto layout */
    background-color: none;

    order: 1;
  }
</style>
