<script lang="ts">
  import TaikoBanner from '$components/Banner/TaikoBanner.svelte';
  import { Page } from '$components/Page';
  import MarketTable from '$components/Table/MarketTable.svelte';
</script>

<Page>
  <div class="flex-col">
    <TaikoBanner />
    <MarketTable />
  </div>
</Page>
