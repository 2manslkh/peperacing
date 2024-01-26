<script lang="ts">
  import NumberBar from "../NumberBar/NumberBar.svelte";
</script>

<airdrop-allocation-breakdown>
  <h2>On chain allocation</h2>
  <NumberBar title="Galaxe Score" value={10} maxValue={100}></NumberBar>
  <NumberBar title="Testnet Score" value={30} maxValue={100}></NumberBar>
  <NumberBar title="Proposer Score" value={70} maxValue={100}></NumberBar>
  <NumberBar title="Prover Score" value={100} maxValue={100}></NumberBar>

  <h2>Off chain allocation</h2>
</airdrop-allocation-breakdown>

<style lang="scss">
  @import "../../styles/colours";

  airdrop-allocation-breakdown {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>
