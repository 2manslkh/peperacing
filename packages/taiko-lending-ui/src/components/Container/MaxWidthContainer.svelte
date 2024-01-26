<div class="flex max-w-[1200px] w-full">
  <slot />
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    padding: 0 1rem;
    box-sizing: border-box; /* Include padding and border in the element's width and height */
    max-width: 1200px;
    width: 100%;
  }
</style>
