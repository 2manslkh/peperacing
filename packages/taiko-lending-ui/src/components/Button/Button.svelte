<script lang="ts">
  import { spring } from 'svelte/motion';
  import RightArrowIcon from '../../public/images/arrow-right.svg';
  export let handleClick: () => void = () => {
    console.log('Unassigned Button');
  };
  export let buttonText = 'Button';
  export let arrow: 'left' | 'right' | null = null;
  export let buttonStyle: 'filled' | 'transparent' = 'filled';

  $: arrowMovement = spring();

  function handleHover() {
    arrowMovement.set(10);
  }

  function handleHoverExit() {
    arrowMovement.set(0);
  }
</script>

<button class="flex {buttonStyle}" on:click={handleClick} on:mouseenter={handleHover} on:mouseleave={handleHoverExit}>
  {#if arrow == 'left'}
    <div
      class="flex absolute ml-2 size-8 bg-white rounded-full items-center content-center justify-center flipped"
      style="transform: translate({$arrowMovement}%, 0%)">
      <img src={RightArrowIcon} alt="arrow" width="14px" height="14px" />
    </div>
    <div class="body-semibold px-2 lg:ml-8">{buttonText}</div>
  {/if}
  {#if arrow == 'right'}
    <div class="body-semibold px-2 lg:mr-8">{buttonText}</div>
    <div
      class="flex absolute right-0 mr-2 size-8 bg-white rounded-full items-center content-center justify-center"
      style="transform: translate({$arrowMovement}%, 0%)">
      <img src={RightArrowIcon} alt="arrow" width="14px" height="14px" />
    </div>
  {/if}
  {#if arrow == null}
    <div class="body-semibold px-2">{buttonText}</div>
  {/if}
</button>

<style lang="scss">
  button {
    box-sizing: border-box;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;

    padding: 1rem 0.5rem 1rem 0.5rem;
    width: 100%;
    height: 40px;
    border-radius: 1000px;
    cursor: pointer;

    font-family: 'Clash Grotesk';
  }

  .filled {
    background: var(--primary-interactive);
    border: 0px;
  }

  .transparent {
    background: none;
    border: 1px var(--primary-interactive) solid;
  }

  button::before {
    content: '';
    margin-right: auto; /* This will push the first real child to the center */
  }

  button::after {
    content: '';
    margin-left: auto; /* This will push the second child to the right */
  }

  .button-text {
    font-style: normal;
    font-weight: 500;
    font-size: 1rem;
    text-align: center;
    align-self: center;

    color: $primary;
    /* Inside auto layout */
  }

  .arrow-container {
    position: absolute;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    width: 32px;
    height: 32px;
    border-radius: 1000px;

    /* Inside auto layout */
    background-color: $primary;
    z-index: 1;
    right: 0px;

    box-sizing: border-box;
    margin: 0.5rem;
  }

  .flipped {
    /* mirror flip */
    rotate: 180deg;
    left: 0px;
  }
</style>
