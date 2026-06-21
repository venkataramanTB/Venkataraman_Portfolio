<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import HeroScene from './HeroScene.svelte';

  export let profile     = null;
  export let socialLinks = [];

  let badgeEl, tagEl, bioEl, linksEl, scrollEl;
  let ctx;

  $: name = (profile?.name ?? 'Venkataraman TB').toUpperCase();

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      // Delay until after the 3D scene entrance (1.5s + 0.4s delay = ~2s)
      const tl = gsap.timeline({ delay: 2.1 });

      tl.from(badgeEl, { opacity: 0, y: 16, duration: 0.5, ease: 'power3.out' })
        .from(tagEl?.querySelectorAll('.tag-seg'),
          { opacity: 0, y: 12, duration: 0.45, stagger: 0.08, ease: 'power3.out' }, '-=0.2')
        .from(bioEl, { opacity: 0, y: 16, duration: 0.5, ease: 'power3.out' }, '-=0.25')
        .from(linksEl?.children ?? [],
          { opacity: 0, y: 12, duration: 0.4, stagger: 0.06, ease: 'power3.out' }, '-=0.2')
        .from(scrollEl, { opacity: 0, duration: 0.4 }, '-=0.1');
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="home" class="relative min-h-screen">

  <!-- 3D scene: full bleed (no horizontal padding) -->
  <div class="w-full pt-20">
    <HeroScene {name} />
  </div>

  <!-- Text content below the 3D canvas -->
  <div class="px-6 max-w-5xl mx-auto mt-10 pb-24">

    <!-- Availability badge -->
    <div bind:this={badgeEl} class="mb-7">
      <span class="inline-flex items-center gap-2 sec-num">
        <span class="w-1.5 h-1.5 rounded-full {profile?.open_to_work !== false ? 'animate-pulse' : ''}"
              style="background: {profile?.open_to_work !== false ? 'var(--accent)' : 'var(--muted)'}"></span>
        {profile?.open_to_work !== false ? 'Available for opportunities' : 'Currently engaged'}
      </span>
    </div>

    <!-- Tagline -->
    <div bind:this={tagEl} class="mb-7">
      <p class="sec-num text-[0.7rem] tracking-[0.18em] flex flex-wrap gap-x-2 gap-y-1">
        <span class="tag-seg">AI Engineer</span>
        <span class="tag-seg" style="color: var(--border)">·</span>
        <span class="tag-seg">Full Stack Developer</span>
        <span class="tag-seg" style="color: var(--border)">·</span>
        <span class="tag-seg">iOS Dev</span>
        <span class="tag-seg" style="color: var(--border)">·</span>
        <span class="tag-seg">ML Engineer</span>
      </p>
    </div>

    <!-- Bio -->
    <div bind:this={bioEl} class="mb-10 max-w-2xl">
      <p class="text-base leading-relaxed" style="color: var(--muted)">
        {profile?.bio ?? 'I architect intelligent systems — LLM-powered agents, ML pipelines, pixel-perfect iOS apps, and high-throughput web backends.'}
      </p>
    </div>

    <!-- Links row -->
    <div bind:this={linksEl} class="flex flex-wrap items-center gap-x-8 gap-y-3">
      {#if profile?.location}
        <span class="sec-num">📍 {profile.location}</span>
      {/if}

      {#each socialLinks as link}
        <a href={link.url} target="_blank" rel="noopener noreferrer"
           class="sec-num hover:text-[var(--text)] hover:text-gradient transition-colors duration-200">
          {link.platform}
        </a>
      {/each}

      {#if profile?.email && !socialLinks.find(l => l.platform?.toLowerCase() === 'email')}
        <a href="mailto:{profile.email}"
           class="sec-num hover:text-[var(--text)] transition-colors duration-200">Email</a>
      {/if}

      <a href="#projects" class="ml-auto group sec-num hover:text-[var(--text)] transition-colors duration-200">
        View work
        <span class="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
      </a>
    </div>

  </div>

  <!-- Scroll cue -->
  <div bind:this={scrollEl}
       class="absolute bottom-10 left-6 flex flex-col items-start gap-2">
    <span class="sec-num" style="font-size:0.6rem; color: var(--border)">SCROLL</span>
    <div class="w-px h-12 overflow-hidden" style="background: var(--border)">
      <div class="w-full h-full scroll-cue" style="background: var(--muted)"></div>
    </div>
  </div>

</section>
