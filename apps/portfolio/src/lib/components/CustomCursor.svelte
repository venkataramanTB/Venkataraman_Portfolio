<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  let cursor, ring;
  let mx = 0, my = 0;

  onMount(() => {
    const moveCursor = (e) => {
      mx = e.clientX;
      my = e.clientY;
      gsap.to(cursor, { x: mx, y: my, duration: 0.1 });
      gsap.to(ring,   { x: mx, y: my, duration: 0.35, ease: 'power2.out' });
    };

    const onEnterLink = () => {
      gsap.to(ring,   { scale: 1.8, borderColor: 'rgba(167,139,250,0.8)', duration: 0.3 });
      gsap.to(cursor, { scale: 0,   duration: 0.2 });
    };
    const onLeaveLink = () => {
      gsap.to(ring,   { scale: 1,   borderColor: 'rgba(167,139,250,0.4)', duration: 0.3 });
      gsap.to(cursor, { scale: 1,   duration: 0.2 });
    };

    document.addEventListener('mousemove', moveCursor);

    // Attach to all interactive elements
    const observer = new MutationObserver(() => {
      document.querySelectorAll('a, button').forEach(el => {
        el.removeEventListener('mouseenter', onEnterLink);
        el.removeEventListener('mouseleave', onLeaveLink);
        el.addEventListener('mouseenter', onEnterLink);
        el.addEventListener('mouseleave', onLeaveLink);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      observer.disconnect();
    };
  });
</script>

<!-- Only show on non-touch devices -->
<div class="pointer-events-none fixed inset-0 z-[99999] hidden md:block">
  <!-- Dot -->
  <div
    bind:this={cursor}
    class="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
    style="top:0;left:0;"
  ></div>
  <!-- Ring -->
  <div
    bind:this={ring}
    class="absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40"
    style="top:0;left:0;"
  ></div>
</div>
