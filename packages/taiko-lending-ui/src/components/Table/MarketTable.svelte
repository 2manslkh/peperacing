<script>
  import MarketTableRow from './MarketTableRow.svelte';
</script>

<div class="shadow-2xl rounded-xl w-full h-full my-8 p-4 text-center border grid">
  <table class="min-w-full">
    <thead class="table-header">
      <tr class="border-b">
        <th class="px-6 py-3">Market</th>
        <th class="px-6 py-3">Total Supply</th>
        <th class="px-6 py-3">Total Borrow</th>
        <th class="px-6 py-3">Utilisation</th>
        <th class="px-6 py-3">Supply APY</th>
        <th class="px-6 py-3">Borrow APY</th>
      </tr>
    </thead>
    <tbody>
      <!-- Repeat this tr for each row -->
      <MarketTableRow />
      <MarketTableRow />
      <MarketTableRow />
      <MarketTableRow />
      <MarketTableRow />
      <!-- ... Other rows -->
    </tbody>
  </table>
</div>
