<script lang="ts">
  export let id = "";
</script>

<container {id}>
  <slot />
</container>

<style lang="scss">
  @import "../../styles/colours";
  container {
    height: 100vh;
    display: flex;
    align-items: center;
  }
</style>
