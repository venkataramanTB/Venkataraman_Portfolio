<script>
  import '../app.css';
  import { onMount } from 'svelte';

  let CustomCursor = null;
  let ChatWidget = null;

  onMount(async () => {
    // load these only in the browser to avoid SSR errors (gsap / DOM deps)
    const [{ default: CC }, { default: CW }] = await Promise.all([
      import('$lib/components/CustomCursor.svelte'),
      import('$lib/components/ChatWidget.svelte'),
    ]);
    CustomCursor = CC;
    ChatWidget = CW;
  });
</script>

{#if CustomCursor}
  <svelte:component this={CustomCursor} />
{/if}

{#if ChatWidget}
  <svelte:component this={ChatWidget} />
{/if}
<div class="noise">
  <slot />
</div>
