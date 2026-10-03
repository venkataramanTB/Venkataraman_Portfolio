<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { token } from '$lib/stores/auth.js';
  import { get } from 'svelte/store';
  import TopNav from '$lib/components/TopNav.svelte';

  // Auth guard — unchanged behaviour, redirect out if there is no token.
  onMount(() => {
    if (!get(token)) goto('/login');
  });
</script>

<div class="console">
  <TopNav />
  <main class="console-main">
    <slot />
  </main>
</div>

<style>
  .console {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .console-main {
    flex: 1;
    width: 100%;
    max-width: 1280px;
    margin-inline: auto;
    padding: clamp(1.25rem, 3vw, 2rem) clamp(1rem, 3vw, 1.75rem) 4rem;
  }
</style>
