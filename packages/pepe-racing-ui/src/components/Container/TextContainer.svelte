<script lang="ts">
</script>

<container>
  <slot />
</container>

<style lang="scss">
  @import "../../styles/colours";
  container {
    display: flex;
    padding: 16px;
    align-items: center;
    gap: 40px;
    border-radius: 5px;
    border: 2px solid $primary_border;
    box-shadow: 0px 0px 5px 0px $primary_border;
  }
</style>
