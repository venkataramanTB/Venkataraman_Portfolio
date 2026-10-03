<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { initTheme } from '$lib/theme.js';

  let stopTheme;

  onMount(() => {
    stopTheme = initTheme();
  });

  onDestroy(() => {
    stopTheme?.();
  });
</script>

<slot />
<Toast />
