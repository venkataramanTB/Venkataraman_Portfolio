<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  let CustomCursor = null;
  let ChatWidget   = null;
  let blob;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, ScrollTrigger } = g;

    // ── Glow blob follows mouse ──────────────────────────────────────────────
    const onMove = (e) => {
      gsap.to(blob, {
        left: e.clientX,
        top:  e.clientY,
        duration: 1.4,
        ease: 'power2.out',
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // ── Magnetic effect on [data-magnetic] elements ──────────────────────────
    ctx = gsap.context(() => {
      document.querySelectorAll('[data-magnetic]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
          const r  = el.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width  / 2) * 0.28;
          const dy = (e.clientY - r.top  - r.height / 2) * 0.28;
          gsap.to(el, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
        });
      });
    });

    // ── Lazy-load browser-only components ───────────────────────────────────
    const [{ default: CC }, { default: CW }] = await Promise.all([
      import('$lib/components/CustomCursor.svelte'),
      import('$lib/components/ChatWidget.svelte'),
    ]);
    CustomCursor = CC;
    ChatWidget   = CW;

    return () => window.removeEventListener('mousemove', onMove);
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<!-- Cursor-following glow -->
<div bind:this={blob} class="glow-blob" aria-hidden="true"></div>

{#if CustomCursor}
  <svelte:component this={CustomCursor} />
{/if}
{#if ChatWidget}
  <svelte:component this={ChatWidget} />
{/if}

<div class="noise relative z-[1]">
  <slot />
</div>
