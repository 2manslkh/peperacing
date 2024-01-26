<script lang="ts">
  import { screenSize, screen } from '$stores/responsiveness';
  import { breakpoints } from '../../styles/breakpoints';

  screenSize.subscribe((value) => {
    if (value < breakpoints.large) {
      $screen = 'mobile';
    } else {
      $screen = 'desktop';
    }
  });
</script>

<svelte:window bind:innerWidth={$screenSize} />
