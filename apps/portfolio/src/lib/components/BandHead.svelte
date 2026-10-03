<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  /** Two-digit section index, e.g. "02" */
  export let index = '00';
  /** Section title — rendered uppercase */
  export let title = '';
  /** Optional right-hand count/telemetry, e.g. "07 entries" */
  export let meta = '';

  let wrapEl, barEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      // Hazard bar draws out from the left as the band enters
      gsap.from(barEl, {
        scaleX: 0,
        duration: 0.7,
        ease: 'expo.out',
        transformOrigin: 'left',
        scrollTrigger: { trigger: wrapEl, start: 'top 90%' },
      });

      gsap.from(wrapEl.querySelectorAll('.bh-item'), {
        opacity: 0,
        y: 14,
        duration: 0.55,
        stagger: 0.07,
        ease: 'power3.out',
        scrollTrigger: { trigger: wrapEl, start: 'top 90%' },
      });
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<header bind:this={wrapEl} class="bh">
  <div bind:this={barEl} class="bh-bar" aria-hidden="true"></div>
  <div class="bh-line">
    <span class="bh-item t-micro bh-idx">{index}</span>
    <h2 class="bh-item bh-title t-head">{title}</h2>
    {#if meta}
      <span class="bh-item t-micro bh-meta">{meta}</span>
    {/if}
  </div>
</header>

<style>
  .bh { margin-bottom: clamp(1.75rem, 4.5vh, 3rem); }

  .bh-bar {
    height: 3px;
    background: var(--hazard);
    width: 100%;
    will-change: transform;
  }

  .bh-line {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding-top: 0.75rem;
  }

  .bh-idx {
    color: var(--hazard);
    font-weight: 600;
  }

  .bh-title {
    margin: 0;
    color: var(--ink);
    flex: 1;
  }

  .bh-meta {
    color: var(--ink-4);
    white-space: nowrap;
  }
</style>
