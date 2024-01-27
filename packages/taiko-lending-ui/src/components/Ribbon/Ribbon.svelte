
<div class="flex w-full moving-gradient text-center items-center justify-center h-8">
  <div class="body-small-bold text-white text-center">
    WAGMI Finance Testnet is LIVE on Taiko Testnet! Get your WETH, WBTC, USDC, USDT, and TTKOK from our faucet and start
    interacting with Taiko Katla Testnet today!
  </div>
</div>

<style>
  /* Define the keyframes for the continuously moving gradient */
  @keyframes moveGradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%; /* Moves the background by twice its size */
    }
    100% {
      background-position: 0% 50%; /* Moves the background by twice its size */
    }
  }

  /* Use Tailwind's utility classes for basic styling and add the animation */
  .moving-gradient {
    @apply bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500;
    background-size: 500% 500%; /* Increase the size to ensure the pattern repeats */
    animation: moveGradient 5s linear infinite;
  }
</style>