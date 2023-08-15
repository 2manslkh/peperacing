<script lang="ts">
  import type { Web3Modal } from "@web3modal/html";

  // variables
  import Logo from "../../public/images/Logo.svg";
  import TwitterLogo from "../../public/images/twitter.png";
  import { web3Modal } from "../../stores";
  import { breakpoints } from "../../styles/breakpoints";
  import TextContainer from "../Container/TextContainer.svelte";
  import PlaynowButton from "../Button/PlaynowButton.svelte";
  import RowContainer from "../Container/RowContainer.svelte";

  let screenSize: number;
  let modalOpen = false;
  let _web3Modal: Web3Modal;

  function toggleModal() {
    modalOpen = !modalOpen;
    console.log(modalOpen);
  }

  web3Modal.subscribe((value) => {
    _web3Modal = value;
  });
</script>

<svelte:window bind:innerWidth={screenSize} />

<header-wrapper>
  {#if screenSize < breakpoints.large}
    <header-logo>
      <img src={Logo} alt="logo" width="50px" height="50px" />
    </header-logo>
  {/if}
  {#if screenSize >= breakpoints.large}
    <RowContainer>
      <header-logo>
        <img src={Logo} alt="logo" width="192px" />
        <!-- <header-title>PROJECT_NAME</header-title> -->
      </header-logo>
      <TextContainer>
        <header-tabs>
          <header-item>
            <a href="#the-game">The Game</a>
          </header-item>
          <header-item>
            <a href="#how-to-bet">How To Bet</a>
          </header-item>
          <header-item>
            <a href="#token">$PPRACE</a>
          </header-item>
        </header-tabs>
      </TextContainer>
    </RowContainer>
    <RowContainer>
      <img src={TwitterLogo} alt="twitter" width="30px" height="25px" />
      <PlaynowButton buttonText="PLAY NOW" />
    </RowContainer>

    {#if _web3Modal}
      <w3m-wrapper>
        <w3m-network-switch style="" />
        <w3m-core-button balance="hide" icon="hide" />
      </w3m-wrapper>
    {/if}
  {/if}
</header-wrapper>

<style lang="scss">
  @import "../../styles/colours";
  @import "../../styles/breakpoints";
  a {
    text-decoration: none; /* Removes underline */
    color: $white; /* Inherits color from its parent */
    font-size: 20px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
  }
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

    width: 100%;
    max-width: 1440px;
    gap: auto;
    padding: 32px;

    @media screen and (max-width: $large) {
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding-left: 0px;
      padding-right: 0px;
      height: 100px;
    }
  }
  header-title {
    /* Auto layout */

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0px;
    gap: 8px;

    width: auto;
    height: 100px;

    /* Inside auto layout */

    font-style: normal;
    font-weight: 600;
    font-size: 2rem;
    line-height: 36px;
  }

  header-tabs {
    /* Frame 2 */

    /* Auto layout */

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0px;
    gap: 40px;

    width: auto;

    /* Inside auto layout */
    color: $background;
    font-size: 1rem;
    font-weight: 400;
  }

  a {
    color: none;
    text-decoration: none;
  }

  a:active {
    color: black;
    background-color: transparent;
  }

  a:hover {
    color: $secondary_1;
    background-color: transparent;
  }

  w3m-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 16px;
  }
</style>
