<script lang="ts">
  import PlaynowButton from "../components/Button/PlaynowButton.svelte";
  import SectionContainer from "../components/Container/SectionContainer.svelte";
  import SearchBox from "../components/Input/SearchBox.svelte";
  import VerticalStack from "../components/Stack/VerticalStack.svelte";
  import Table from "../components/Table/Table.svelte";
</script>

<SectionContainer>
  <pepe-underlay />
  <VerticalStack>
    <title>PePeRace</title>
    <description
      >First Telegram <span style="color: #049C5F">PePe</span> Race Bot <br /> Bet on your winning
      <span style="color: #049C5F">PePe</span>
    </description>
    <PlaynowButton buttonText="PLAY NOW" />
  </VerticalStack>
</SectionContainer>

<style lang="scss">
  @import "../styles/colours";

  title {
    width: auto;

    display: flex;
    align-items: center;

    color: $secondary_1;
    text-shadow: 0px 0px 36px $secondary_1;
    font-size: 9em;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
  }

  description {
    max-width: 440px;

    align-items: center;
    text-align: center;

    color: $primary;
    font-size: 1.5em;
    font-style: normal;
    font-weight: 400;
    line-height: 32px;
    word-break: normal;
    padding-bottom: 2rem;
  }

  pepe-underlay {
    background: url("../public/images/pepe-ascii.png") no-repeat center center fixed;
    position: absolute;
    width: 100%;
    height: 100%;
    right: 0px;
    opacity: 0.5;
    z-index: -1;
  }
</style>
