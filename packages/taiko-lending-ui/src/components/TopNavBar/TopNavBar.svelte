<script lang="ts">
  // variables
  import Logo from '../../public/images/taiko-b.svg';
  import { web3Modal } from '$stores';
  import { screen } from '$stores';
</script>

<div class="flex justify-between items-center max-w-7xl w-full pb-4">
  {#if $screen == 'mobile'}
    <div class="flex justify-between items-center">
      <img src={Logo} alt="logo" />
    </div>
  {/if}
  {#if $screen == 'desktop'}
    <div class="flex justify-between items-center">
      <img src={Logo} alt="logo" />
    </div>
    <div class="flex items-center justify-center gap-14 h-10">
      <header-item>
        <a class="text-primary-content body-semibold" href="/markets">Markets</a>
      </header-item>
      <header-item>
        <a class="text-primary-content body-semibold" href="/dashboard">Dashboard</a>
      </header-item>
      <header-item>
        <a class="text-primary-content body-semibold" href="/faucet">Faucet</a>
      </header-item>
    </div>
    {#if $web3Modal}
      <w3m-button class="bg-pink-600 rounded-full" />
    {/if}
  {/if}
</div>

<style lang="scss">
  header-logo {
    /* Auto layout */
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
  header-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    margin: 0 auto; /* Center the container */

    width: 100%;
    max-width: 1200px;
    gap: auto;
    padding: 1rem 1.5rem;

    border-radius: 1000px;
    background: linear-gradient(179deg, rgba(93, 99, 111, 0.1) -5.48%, rgba(93, 99, 111, 0.2) 108.92%);
  }

  header-tabs {
    /* Frame 2 */

    /* Auto layout */

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0px;
    gap: 56px;

    width: auto;
    height: 36px;

    /* Inside auto layout */
  }
</style>
