<script lang="ts">
  import { spring } from 'svelte/motion';

  export let count = 0;

  const displayed_count = spring();
  $: displayed_count.set(count, { hard: count === 59 });
  $: offset = modulo($displayed_count, 1);

  function modulo(n: number, m: number) {
    // handle negative numbers
    return ((n % m) + m) % m;
  }
</script>

<div class="w-full min-w-[80px] lg:min-w-[120px] overflow-hidden text-center relative min-h-[64px] lg:min-h-[120px]">
  <div class="absolute w-full h-full" style="transform: translate(0, {100 * offset}%)">
    <div class="top-[-100%] select-none display-large-medium lg:display-xl-medium" hidden>
      {Math.floor($displayed_count + 1)}
    </div>
    <div class="display-large-medium select-none lg:display-xl-medium">{Math.floor($displayed_count)}</div>
  </div>
</div>
