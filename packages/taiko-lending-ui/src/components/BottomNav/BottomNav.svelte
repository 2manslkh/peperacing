<script lang="ts">
  import { screen } from '$stores/responsiveness';
  import { breakpoints } from '../../styles/breakpoints';

  let activeTab: string = 'item1';
  let screenSize: number;
  function setActiveTab(tabName: string) {
    activeTab = tabName;
  }
</script>

{#if $screen == 'desktop'}
  <section>
    <button class={activeTab === 'item1' ? 'active' : ''} on:click={() => setActiveTab('item1')}> ITEM_1 </button>
    <button class={activeTab === 'item2' ? 'active' : ''} on:click={() => setActiveTab('item2')}> ITEM_2 </button>
  </section>
{/if}

<style lang="scss">
  section {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    position: fixed;
    bottom: 0;
    right: 0;

    align-items: center;
    width: 100%;
    height: 100px;
  }

  button {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    font-size: 1rem;
    color: $primary;

    border: none;
    border-radius: 0px;
    cursor: pointer;
    margin: 0;
    box-shadow: none;
    height: 100%;
  }

  button.active {
    width: 100%;
    color: $primary;
    border: none;
    border-radius: 0px;
    font-weight: bold;
    box-shadow: none;
  }
</style>
