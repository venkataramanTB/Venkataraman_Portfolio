<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  let dot, ring;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    // Set initial position off-screen so they don't flash at 0,0
    gsap.set([dot, ring], { x: -200, y: -200 });

    const onMove = (e) => {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.06, ease: 'none' });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.28, ease: 'power2.out' });
    };

    const onEnter = () => {
      gsap.to(ring, { scale: 2, borderColor: 'rgba(6,182,212,0.7)', duration: 0.25, ease: 'power2.out' });
      gsap.to(dot,  { scale: 0, duration: 0.2 });
    };
    const onLeave = () => {
      gsap.to(ring, { scale: 1, borderColor: 'rgba(6,182,212,0.35)', duration: 0.25 });
      gsap.to(dot,  { scale: 1, duration: 0.2 });
    };
    const onClick = () => {
      gsap.to(ring, { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick);

    const obs = new MutationObserver(() => {
      document.querySelectorAll('a, button, [data-magnetic]').forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick);
      obs.disconnect();
    };
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<div class="pointer-events-none fixed inset-0 z-[99999] hidden md:block">
  <!-- Inner dot -->
  <div bind:this={dot}
       class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-[6px] h-[6px]"
       style="top:0;left:0;background:var(--accent);box-shadow:0 0 8px var(--accent)">
  </div>
  <!-- Outer ring -->
  <div bind:this={ring}
       class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-9 h-9 border"
       style="top:0;left:0;border-color:rgba(6,182,212,0.35);box-shadow:0 0 14px rgba(6,182,212,0.08)">
  </div>
</div>
