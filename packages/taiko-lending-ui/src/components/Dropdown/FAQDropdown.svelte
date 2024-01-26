<script lang="ts">
  import SectionContainer from '../Container/SectionContainer.svelte';
  import { slide } from 'svelte/transition';

  export let question: string = 'Placeholder Preview Text';
  export let answer: string = 'Placeholder FAQ Text';

  let isOpen = false;

  function toggleDropdown() {
    isOpen = !isOpen;
  }
</script>

<div class="dropdown-container">
  <button class="dropdown-btn" on:click={toggleDropdown}>
    <div class="d-sm-m">{question}</div>
    <div class="icon" class:open={isOpen}>+</div>
  </button>
  {#if isOpen}
    <div class="dropdown-content" transition:slide>
      <!-- Dropdown content goes here -->
      <p>{answer}</p>
    </div>
  {/if}
</div>

<style lang="scss">
  .dropdown-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    border-radius: 1.5rem;
    padding: 2rem 2rem;
    box-sizing: border-box;
    background: $container-background;
    word-break: keep-all;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }
  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0px;

    color: $primary;
  }

  .dropdown-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    .d-sm-m {
      text-align: left;
      font-size: 26px;
      line-height: 84%;
    }
  }

  .icon {
    display: inline-block;
    font-size: 2rem;
    line-height: 1rem;

    transition: transform 0.3s ease;
  }

  .icon.open {
    transform: rotate(45deg); /* Plus icon turns into a 'x' */
  }

  .dropdown-content {
    padding: 1em;
    border-top: 1px solid #444; /* Slight contrast to the dropdown */
    width: 100%;
  }
</style>
