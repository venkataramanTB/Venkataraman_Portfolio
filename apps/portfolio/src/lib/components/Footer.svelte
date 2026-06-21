<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  export let profile     = null;
  export let socialLinks = [];

  const year = new Date().getFullYear();
  let footerEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      gsap.from(footerEl?.children ?? [], {
        opacity: 0, y: 18, duration: 0.55,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: footerEl, start: 'top 95%' },
      });
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<footer class="py-10 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-10" />
  <div bind:this={footerEl}
       class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <p class="sec-num">
      © {year} {profile?.name ?? 'Venkataraman TB'}
      <span style="color: var(--border)">—</span>
      Built with SvelteKit + GSAP
    </p>
    <div class="flex items-center gap-6">
      {#each socialLinks as link}
        <a href={link.url} target="_blank" rel="noopener"
           class="sec-num hover:text-[var(--text)] transition-colors duration-200">
          {link.platform}
        </a>
      {/each}
      <a href="#home" class="sec-num hover:text-[var(--accent)] transition-colors duration-200">
        ↑ Top
      </a>
    </div>
  </div>
</footer>
