<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import Hero3D  from './Hero3D.svelte';
  import Avatar3D from './Avatar3D.svelte';

  export let profile     = null;
  export let socialLinks = [];

  let badgeEl, nameWrapEl, tagEl, bioEl, linksEl, scrollEl;
  let ctx;

  $: name = (profile?.name ?? 'Venkataraman TB').toUpperCase();

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.25 });

      tl.from(badgeEl, { opacity: 0, y: 22, duration: 0.6, ease: 'power3.out' })

        // 3D canvas wrapper fades in (Hero3D handles its own particle entrance)
        .from(nameWrapEl, { opacity: 0, duration: 0.9, ease: 'power2.out' }, '-=0.2')

        .from(tagEl?.querySelectorAll('.tag-seg'),
          { opacity: 0, y: 14, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
          '-=0.5'
        )

        .from(bioEl, { opacity: 0, y: 20, duration: 0.65, ease: 'power3.out' }, '-=0.35')

        .from(linksEl?.children ?? [],
          { opacity: 0, y: 14, duration: 0.5, stagger: 0.07, ease: 'power3.out' },
          '-=0.3'
        )

        .from(scrollEl, { opacity: 0, duration: 0.5 }, '-=0.1');
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="home" class="relative min-h-screen px-6 pb-20 pt-28 max-w-6xl mx-auto">

  <!-- Two-column grid: text left, avatar right (desktop only) -->
  <div class="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] gap-x-12 gap-y-0
              min-h-[calc(100vh-7rem)] items-center">

    <!-- ── LEFT: text content ───────────────────────────────────────────── -->
    <div class="flex flex-col justify-center py-10 order-2 lg:order-1">

      <!-- Availability badge -->
      <div bind:this={badgeEl} class="mb-8">
        <span class="inline-flex items-center gap-2 sec-num">
          <span class="w-1.5 h-1.5 rounded-full {profile?.open_to_work !== false ? 'animate-pulse' : ''}"
                style="background: {profile?.open_to_work !== false ? 'var(--accent)' : 'var(--muted)'}"></span>
          {profile?.open_to_work !== false ? 'Available for opportunities' : 'Currently engaged'}
        </span>
      </div>

      <!-- 3D particle name -->
      <div bind:this={nameWrapEl} class="mb-6 w-full relative" style="z-index:1">
        <Hero3D {name} />
      </div>

      <!-- Tagline -->
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
      <div bind:this={bioEl} class="mb-10 max-w-xl">
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

    <!-- ── RIGHT: 3D avatar (desktop only) ─────────────────────────────── -->
    <div class="hidden lg:block order-1 lg:order-2 relative self-stretch"
         style="min-height: 520px">

      <!-- Subtle glow behind avatar -->
      <div class="absolute inset-0 pointer-events-none"
           style="background: radial-gradient(ellipse 60% 70% at 50% 60%,
                    rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.04) 55%, transparent 80%)">
      </div>

      <Avatar3D />
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
