<script lang="ts">
  import '../app.css';
  import '../i18n';
  import WalletConnect from '$components/Web3/WalletConnect.svelte';
  import TopNavBar from '$components/TopNavBar/TopNavBar.svelte';
  import MaxWidthContainer from '$components/Container/MaxWidthContainer.svelte';

  import Toasts from '$components/Toast/Toasts.svelte';
  import Footer from '$components/Footer/Footer.svelte';
  import Responsiveness from '$components/Responsiveness/Responsiveness.svelte';
  import { PUBLIC_WALLETCONNECT_PROJECT_ID } from '$env/static/public';
  import { onMount } from 'svelte';
  import Ribbon from '$components/Ribbon/Ribbon.svelte';

  // Throw Error if no projectId is set
  if (!PUBLIC_WALLETCONNECT_PROJECT_ID) {
    console.log(
      'PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Please set it in .env! https://cloud.walletconnect.com/app',
    );
  }
  onMount(() => {
    // Set theme

    // localStorage.setItem('theme', 'light');
    const theme = localStorage.getItem('theme');
    document.documentElement.setAttribute('data-theme', 'light'); // Set default theme

    console.log('🚀 | onMount | theme:', theme);
  });

  // If change to account, update address
</script>

<Responsiveness />

<!-- Comment to Disable WEB3 (Requires VITE_WEB3MODAL_PROJECT_ID to work) -->
{#if PUBLIC_WALLETCONNECT_PROJECT_ID}
  <WalletConnect projectId={PUBLIC_WALLETCONNECT_PROJECT_ID} />
{/if}

<!-- Header -->
<Toasts />

<header>
  <MaxWidthContainer>
    <TopNavBar />
  </MaxWidthContainer>
  <Ribbon />
</header>
<main>
  <MaxWidthContainer>
    <slot />
  </MaxWidthContainer>
</main>

<!-- <footer>
  <MaxWidthContainer>
    <Footer></Footer>
  </MaxWidthContainer>
</footer> -->

<style lang="scss">
  @font-face {
    font-family: 'Clash Grotesk';
    src: url('../public/fonts/ClashGrotesk/Fonts/Variable/ClashGrotesk-Variable.ttf');
  }

  @font-face {
    font-family: 'Public Sans';
    src: url('../public/fonts/PublicSans/PublicSans-VariableFont_wght.ttf');
  }

  @font-face {
    font-family: 'Montserrat';
    src: url('../public/fonts/Montserrat/Montserrat-VariableFont_wght.ttf');
  }

  :root {
    font-family: 'Montserrat';
    background: var(--primary-background);
    color: var(--primary-content);
    font-size: 16px;
    font-weight: 400;
    word-break: keep-all;
  }

  header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem 0rem 1rem 0rem;
  }

  main {
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  /* footer {
    height: 100px;
    width: 100%;
  } */
</style>
