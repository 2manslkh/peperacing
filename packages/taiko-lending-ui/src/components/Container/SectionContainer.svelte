<script lang="ts">
  export let flexDirection: 'row' | 'column' = 'row';
  export let backgroundColor: string = '';
  let background = backgroundColor == '' ? '' : `background: ${backgroundColor};`;
</script>

<div
  class="flex bg-container bg-im rounded-3xl py-6 px-4 w-full box-border max-w-7xl gap-4 {flexDirection} items-center"
  style={background}>
  <slot />
</div>

<style lang="scss">
  .row {
    flex-direction: row;
  }

  .column {
    flex-direction: column;
  }
</style>
