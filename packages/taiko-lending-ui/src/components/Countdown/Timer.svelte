<!-- CountdownTimer.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  import RollingNumber from './RollingNumber.svelte';

  export let targetTimestamp: number;

  let days: number;
  let hours: number;
  let minutes: number;
  let seconds: number;
  let interval: ReturnType<typeof setInterval>;

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const targetDate = new Date(targetTimestamp * 1000);
    const difference = targetDate.getTime() - now;

    if (difference > 0) {
      days = Math.floor(difference / (1000 * 60 * 60 * 24));
      hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      seconds = Math.floor((difference % (1000 * 60)) / 1000);
    } else {
      days = 0;
      hours = 0;
      minutes = 0;
      seconds = 0;
    }
  }

  onMount(() => {
    calculateTimeLeft(); // Initial calculation
    interval = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(interval);
    };
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="display-small-medium break-keep">Airdrop starts in</div>
<div class="flex align-center justify-center w-full display-large-medium lg:display-xl-medium">
  <div class="time-section">
    <RollingNumber count={days} />
    <div class="title-body-regular lg:title-subsection-regular opacity-50">Days</div>
  </div>
  <div class="time-section">
    <RollingNumber count={hours} />
    <div class="title-body-regular lg:title-subsection-regular opacity-50">Hours</div>
  </div>
  <div class="time-section">
    <RollingNumber count={minutes} />
    <div class="title-body-regular lg:title-subsection-regular opacity-50">Minutes</div>
  </div>
  <div class="time-section">
    <RollingNumber count={seconds} />
    <div class="title-body-regular lg:title-subsection-regular opacity-50">Seconds</div>
  </div>
</div>

<style lang="scss">
  .time-section {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .label {
    font-size: 1rem;
    font-style: normal;
    font-weight: 500;
    color: $secondary_1;
    height: 100%;
    align-self: center;
  }
</style>
