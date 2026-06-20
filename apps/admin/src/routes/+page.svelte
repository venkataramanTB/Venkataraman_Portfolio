<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { token } from '$lib/stores/auth.js';
  import { get } from 'svelte/store';

  onMount(() => {
    if (get(token)) goto('/dashboard');
    else goto('/login');
  });
</script>
