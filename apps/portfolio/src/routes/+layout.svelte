<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import { initTheme } from '$lib/theme.js';

  let CustomCursor = null;
  let ChatWidget   = null;
  let ctx;
  let stopTheme;

  onMount(async () => {
    // Substrate first: syncs the store with what app.html already applied,
    // and starts tracking OS + cross-tab changes.
    stopTheme = initTheme();

    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    // Mechanical press feedback on anything marked [data-press].
    // Replaces the old magnetic/elastic float — this system is rigid, not springy.
    ctx = gsap.context(() => {
      document.querySelectorAll('[data-press]').forEach((el) => {
        el.addEventListener('pointerdown', () =>
          gsap.to(el, { y: 1, duration: 0.08, ease: 'none' })
        );
        el.addEventListener('pointerup', () =>
          gsap.to(el, { y: 0, duration: 0.18, ease: 'power2.out' })
        );
        el.addEventListener('pointerleave', () =>
          gsap.to(el, { y: 0, duration: 0.18, ease: 'power2.out' })
        );
      });
    });

    const [{ default: CC }, { default: CW }] = await Promise.all([
      import('$lib/components/CustomCursor.svelte'),
      import('$lib/components/ChatWidget.svelte'),
    ]);
    CustomCursor = CC;
    ChatWidget   = CW;
  });

  onDestroy(() => {
    ctx?.revert();
    stopTheme?.();
  });
</script>

<!-- Blueprint column guides: fixed, decorative, behind everything -->
<div class="guides" aria-hidden="true">
  <div class="shell guides-inner">
    {#each Array(6) as _, i}
      <span class="guide-col" class:guide-hide={i > 2}></span>
    {/each}
  </div>
</div>

<!-- Edge registration marks -->
<div class="reg reg-tl" aria-hidden="true"></div>
<div class="reg reg-tr" aria-hidden="true"></div>
<div class="reg reg-bl" aria-hidden="true"></div>
<div class="reg reg-br" aria-hidden="true"></div>

{#if CustomCursor}
  <svelte:component this={CustomCursor} />
{/if}
{#if ChatWidget}
  <svelte:component this={ChatWidget} />
{/if}

<slot />

<!-- Mechanical noise film, topmost and inert -->
<div class="grain" aria-hidden="true"></div>

<style>
  .guides {
    position: fixed;
    inset: 0;
    z-index: var(--z-base);
    pointer-events: none;
  }
  .guides-inner {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    height: 100%;
  }
  .guide-col {
    border-left: 1px solid var(--grid-line);
  }
  .guide-col:last-child {
    border-right: 1px solid var(--grid-line);
  }
  @media (max-width: 900px) {
    .guide-hide { display: none; }
    .guides-inner { grid-template-columns: repeat(3, 1fr); }
  }

  /* Corner registration crosses — printer's trim marks */
  .reg {
    position: fixed;
    width: 11px;
    height: 11px;
    z-index: var(--z-raised);
    pointer-events: none;
    background-image:
      linear-gradient(var(--rule-strong), var(--rule-strong)),
      linear-gradient(var(--rule-strong), var(--rule-strong));
    background-size: 100% 1px, 1px 100%;
    background-position: center center, center center;
    background-repeat: no-repeat;
  }
  .reg-tl { top: 10px;    left: 10px;  }
  .reg-tr { top: 10px;    right: 10px; }
  .reg-bl { bottom: 10px; left: 10px;  }
  .reg-br { bottom: 10px; right: 10px; }

  @media (max-width: 640px) {
    .reg { display: none; }
  }
</style>
