<script>
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { token } from '$lib/stores/auth.js';
  import { get } from 'svelte/store';

  onMount(() => {
    if (get(token)) goto(`${base}/dashboard`);
    else goto(`${base}/login`);
  });
</script>
