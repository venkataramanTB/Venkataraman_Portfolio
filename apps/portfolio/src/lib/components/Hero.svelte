<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import ParticleText from './ParticleText.svelte';
  import NeuralCanvas  from './NeuralCanvas.svelte';

  export let profile     = null;
  export let socialLinks = [];

  let badgeEl, nameWrapEl, tagEl, bioEl, linksEl, scrollEl;
  let ctx;

  $: name = (profile?.name ?? 'Venkataraman TB').toUpperCase();

  function getSocial(platform) {
    return socialLinks.find(l => l.platform?.toLowerCase() === platform)?.url ?? null;
  }

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.25 });

      // Availability badge
      tl.from(badgeEl, { opacity: 0, y: 22, duration: 0.6, ease: 'power3.out' })

      // Name canvas wrapper fades in (ParticleText handles its own particle animation)
        .from(nameWrapEl, { opacity: 0, duration: 0.9, ease: 'power2.out' }, '-=0.2')

      // Tagline: each segment staggered
        .from(tagEl?.querySelectorAll('.tag-seg'),
          { opacity: 0, y: 14, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
          '-=0.5'
        )

      // Bio paragraph
        .from(bioEl, { opacity: 0, y: 20, duration: 0.65, ease: 'power3.out' }, '-=0.35')

      // Social links + CTA
        .from(linksEl?.children ?? [],
          { opacity: 0, y: 14, duration: 0.5, stagger: 0.07, ease: 'power3.out' },
          '-=0.3'
        )

      // Scroll cue
        .from(scrollEl, { opacity: 0, duration: 0.5 }, '-=0.1');
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="home" class="relative min-h-screen flex flex-col justify-center px-6 pb-20 pt-28 max-w-5xl mx-auto">

  <!-- Availability badge -->
  <div bind:this={badgeEl} class="mb-10">
    <span class="inline-flex items-center gap-2 sec-num">
      <span class="w-1.5 h-1.5 rounded-full {profile?.open_to_work !== false ? 'animate-pulse' : ''}"
            style="background: {profile?.open_to_work !== false ? 'var(--accent)' : 'var(--muted)'}"></span>
      {profile?.open_to_work !== false ? 'Available for opportunities' : 'Currently engaged'}
    </span>
  </div>

  <!-- Particle name (canvas) -->
  <div bind:this={nameWrapEl} class="mb-6 w-full relative" style="z-index:1">
    <ParticleText {name} color="var(--text)" gap={4} dotSize={2} speed={0.062} />
    <div class="hero-canvas">
      <NeuralCanvas />
    </div>
  </div>

  <!-- Tagline with individual segments -->
  <div bind:this={tagEl} class="mb-8">
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
  <div bind:this={bioEl} class="mb-12 max-w-2xl">
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

  <!-- Scroll cue -->
  <div bind:this={scrollEl}
       class="absolute bottom-10 left-6 flex flex-col items-start gap-2">
    <span class="sec-num" style="font-size:0.6rem; color: var(--border)">SCROLL</span>
    <div class="w-px h-12 overflow-hidden" style="background: var(--border)">
      <div class="w-full h-full scroll-cue" style="background: var(--muted)"></div>
    </div>
  </div>
</section>
