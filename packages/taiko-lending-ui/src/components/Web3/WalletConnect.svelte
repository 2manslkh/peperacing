<script lang="ts">
  import { sepolia } from '@wagmi/core/chains';
  import { web3Modal, account } from '$stores';
  import { getAccount } from '@wagmi/core';
  import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
  import { onMount } from 'svelte';

  export let projectId: string;

  // 2. Create wagmiConfig
  const metadata = {
    name: 'Taiko Trailblazer',
    description: 'Taiko Trailblazer',
    url: 'Taiko Trailblazer',
    icons: ['https://avatars.githubusercontent.com/u/99078433'],
  };

  onMount(() => {
    const chains = [sepolia];
    const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });
    $web3Modal = createWeb3Modal({
      wagmiConfig,
      projectId,
      chains,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-font-family': 'Clash Grotesk',
        '--w3m-color-mix-strength': 10,
        '--w3m-accent': '#E81899',
        '--w3m-color-mix': '#FFFFFF',
      },
    });
    $account = getAccount();
  });
</script>
