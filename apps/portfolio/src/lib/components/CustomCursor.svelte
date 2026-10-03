<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import { gsap } from 'gsap';

  let reticle, xLabel, yLabel;
  let enabled = false;
  let raf;
  let onMove, onDown, onUp, onOver;

  onMount(async () => {
    // Pointer reticle is meaningless on touch and wasteful under reduced motion.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;

    // Render the reticle first, then wait for the DOM to flush — `bind:this`
    // is still undefined until Svelte has processed the {#if} block.
    enabled = true;
    await tick();

    // If the node somehow never mounted, bail out without hiding the real
    // cursor. Losing the OS cursor with nothing to replace it is unusable.
    if (!reticle) {
      enabled = false;
      return;
    }

    document.documentElement.classList.add('has-reticle');

    const xTo = gsap.quickTo(reticle, 'x', { duration: 0.13, ease: 'power3.out' });
    const yTo = gsap.quickTo(reticle, 'y', { duration: 0.13, ease: 'power3.out' });

    let lx = 0, ly = 0, pending = false;

    const paint = () => {
      pending = false;
      // Live coordinate readout — telemetry, consistent with the rest of the page
      if (xLabel) xLabel.textContent = String(Math.round(lx)).padStart(4, '0');
      if (yLabel) yLabel.textContent = String(Math.round(ly)).padStart(4, '0');
    };

    onMove = (e) => {
      lx = e.clientX;
      ly = e.clientY;
      xTo(lx);
      yTo(ly);
      if (!pending) {
        pending = true;
        raf = requestAnimationFrame(paint);
      }
    };

    onDown = () => gsap.to(reticle, { scale: 0.8, duration: 0.1, ease: 'power2.out' });
    onUp   = () => gsap.to(reticle, { scale: 1,   duration: 0.2, ease: 'power2.out' });

    // Lock on when over anything interactive
    onOver = (e) => {
      const hit = e.target?.closest?.('a, button, input, textarea, select, [role="button"]');
      reticle?.classList.toggle('is-lock', Boolean(hit));
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });

    // Place it under the pointer immediately rather than parking it at 0,0
    // until the first move event arrives.
    const seed = (e) => {
      gsap.set(reticle, { x: e.clientX, y: e.clientY });
      lx = e.clientX;
      ly = e.clientY;
      paint();
      window.removeEventListener('pointermove', seed);
    };
    window.addEventListener('pointermove', seed, { passive: true, once: true });
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    cancelAnimationFrame(raf);
    if (onMove) window.removeEventListener('pointermove', onMove);
    if (onDown) window.removeEventListener('pointerdown', onDown);
    if (onUp)   window.removeEventListener('pointerup', onUp);
    if (onOver) window.removeEventListener('pointerover', onOver);
    document.documentElement.classList.remove('has-reticle');
  });
</script>

{#if enabled}
  <div bind:this={reticle} class="reticle" aria-hidden="true">
    <span class="arm arm-l"></span>
    <span class="arm arm-r"></span>
    <span class="arm arm-t"></span>
    <span class="arm arm-b"></span>
    <span class="box"></span>
    <span class="coords">
      <span bind:this={xLabel}>0000</span>:<span bind:this={yLabel}>0000</span>
    </span>
  </div>
{/if}

<style>
  /* Hide the OS cursor only while the reticle is actually live */
  :global(html.has-reticle),
  :global(html.has-reticle *) {
    cursor: none !important;
  }

  .reticle {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: var(--z-grain);
    pointer-events: none;
    will-change: transform;
  }

  /* Four separate segments leaving a 7px gap at centre, so the reticle never
     obscures the thing it is pointing at. */
  .arm {
    position: absolute;
    background: var(--ink);
  }
  .arm-l { top: -0.5px; left: -16px; width: 12px; height: 1px; }
  .arm-r { top: -0.5px; left: 4px;   width: 12px; height: 1px; }
  .arm-t { left: -0.5px; top: -16px; width: 1px; height: 12px; }
  .arm-b { left: -0.5px; top: 4px;   width: 1px; height: 12px; }

  .box {
    position: absolute;
    top: -5px;
    left: -5px;
    width: 10px;
    height: 10px;
    border: 1px solid var(--ink);
    opacity: 0;
    transition: opacity 160ms var(--ease-out);
  }

  .coords {
    position: absolute;
    top: 12px;
    left: 12px;
    font-family: var(--font-mono);
    font-size: 0.5rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    color: var(--ink-4);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    opacity: 0;
    transition: opacity 160ms var(--ease-out);
  }

  /* Locked on an interactive target */
  .reticle:global(.is-lock) .arm { background: var(--hazard); }
  .reticle:global(.is-lock) .box { opacity: 1; border-color: var(--hazard); }
  .reticle:global(.is-lock) .coords { opacity: 1; color: var(--hazard); }
</style>
