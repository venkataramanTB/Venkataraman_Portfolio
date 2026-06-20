<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { token } from '$lib/stores/auth.js';
  import { get } from 'svelte/store';
  import Sidebar from '$lib/components/Sidebar.svelte';

  onMount(() => {
    if (!get(token)) goto('/login');
  });
</script>

<div class="flex min-h-screen">
  <Sidebar />
  <main class="flex-1 overflow-y-auto p-8 max-w-5xl">
    <slot />
  </main>
</div>
