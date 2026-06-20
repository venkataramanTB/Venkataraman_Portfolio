<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  let dot, ring;

  onMount(() => {
    const move = (e) => {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.08 });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.3, ease: 'power2.out' });
    };

    const enter = () => {
      gsap.to(ring, { scale: 1.9, borderColor: 'rgba(163,230,53,0.7)', duration: 0.25 });
      gsap.to(dot,  { scale: 0,   duration: 0.2 });
    };
    const leave = () => {
      gsap.to(ring, { scale: 1,   borderColor: 'rgba(163,230,53,0.35)', duration: 0.25 });
      gsap.to(dot,  { scale: 1,   duration: 0.2 });
    };

    document.addEventListener('mousemove', move);

    const obs = new MutationObserver(() => {
      document.querySelectorAll('a, button, canvas').forEach(el => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', move);
      obs.disconnect();
    };
  });
</script>

<div class="pointer-events-none fixed inset-0 z-[99999] hidden md:block">
  <!-- dot -->
  <div bind:this={dot}
       class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-2 h-2"
       style="top:0;left:0;background:var(--accent)"></div>
  <!-- ring -->
  <div bind:this={ring}
       class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-8 h-8 border"
       style="top:0;left:0;border-color:rgba(163,230,53,0.35)"></div>
</div>
