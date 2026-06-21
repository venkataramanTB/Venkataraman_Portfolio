<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  export let profile     = null;
  export let socialLinks = [];

  let line1El, line2El, rolesEl, bioEl, linksEl, photoWrapEl, imgEl, scrollEl;
  let photoVisible = true;
  let ctx;

  $: nameParts = (profile?.name ?? 'Venkataraman TB').toUpperCase().split(' ');
  $: line1     = nameParts[0];
  $: line2     = nameParts.slice(1).join(' ');

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    if (imgEl) imgEl.onerror = () => { photoVisible = false; };

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      // Photo: curtain wipe upward
      if (photoWrapEl) {
        tl.fromTo(photoWrapEl,
          { clipPath: 'inset(100% 0 0 0)' },
          { clipPath: 'inset(0% 0 0 0)', duration: 1.15, ease: 'power4.inOut' },
          0
        );
      }

      // Name lines slide up from clip
      tl.from([line1El, line2El].filter(Boolean), {
        yPercent: 108,
        opacity:  0,
        duration: 0.9,
        stagger:  0.12,
        ease: 'power3.out',
      }, 0.15);

      // Roles, bio, links cascade in
      tl.from(rolesEl, { opacity: 0, y: 14, duration: 0.5 }, '-=0.35')
        .from(bioEl,   { opacity: 0, y: 12, duration: 0.5 }, '-=0.3')
        .from(linksEl?.children ?? [],
          { opacity: 0, y: 10, stagger: 0.05, duration: 0.4 }, '-=0.25')
        .from(scrollEl, { opacity: 0, duration: 0.35 }, '-=0.1');
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="home" class="relative px-6 max-w-6xl mx-auto" style="min-height:100svh">

  <!-- Grid -->
  <div class="grid {photoVisible ? 'lg:grid-cols-[1fr_min(36%,390px)]' : ''} gap-x-14 items-start pt-28 pb-28">

    <!-- Left: name + content -->
    <div class="flex flex-col">

      <!-- Name lines (each wrapped for slide-up clip) -->
      <div class="mb-8 select-none">
        <div class="name-clip">
          <div bind:this={line1El} class="hero-name">{line1}</div>
        </div>
        {#if line2}
          <div class="name-clip">
            <div bind:this={line2El} class="hero-name hero-sub text-right">{line2}</div>
          </div>
        {/if}
      </div>

      <!-- Role tags -->
      <div bind:this={rolesEl}
           class="flex flex-wrap items-center gap-x-5 gap-y-2 pb-8 mb-8 border-b border-[var(--border)]">
        {#each ['AI Engineer','Full Stack Developer','iOS Dev','ML Engineer'] as role, i}
          {#if i > 0}<span style="color:var(--border)" aria-hidden="true">—</span>{/if}
          <span class="sec-num">{role}</span>
        {/each}
      </div>

      <!-- Bio -->
      <p bind:this={bioEl}
         class="text-[0.92rem] leading-relaxed max-w-[46ch] mb-10"
         style="color:var(--muted)">
        {profile?.bio ?? 'I architect intelligent systems — LLM-powered agents, ML pipelines, pixel-perfect iOS apps, and high-throughput web backends.'}
      </p>

      <!-- Links -->
      <div bind:this={linksEl} class="flex flex-wrap items-center gap-x-8 gap-y-3">
        {#if profile?.location}
          <span class="sec-num">📍 {profile.location}</span>
        {/if}
        {#each socialLinks as link}
          <a href={link.url} target="_blank" rel="noopener noreferrer"
             class="sec-num hover:text-[var(--accent)] transition-colors duration-200">
            {link.platform}
          </a>
        {/each}
        {#if profile?.email && !socialLinks.find(l => l.platform?.toLowerCase() === 'email')}
          <a href="mailto:{profile.email}"
             class="sec-num hover:text-[var(--accent)] transition-colors duration-200">Email</a>
        {/if}
        <a href="#projects"
           class="ml-auto group sec-num hover:text-[var(--text)] transition-colors duration-200">
          View work
          <span class="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
        </a>
      </div>
    </div>

    <!-- Right: profile photo — black & white only in hero -->
    {#if photoVisible}
      <div bind:this={photoWrapEl} class="hero-photo sticky top-24 overflow-hidden">
        <img
          bind:this={imgEl}
          src="/profile_picture.png"
          alt={profile?.name ?? 'Venkataraman TB'}
          class="w-full h-full object-cover object-top block photo-bw"
        />
        <div class="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
             style="background:linear-gradient(to bottom,transparent,var(--bg) 96%)"></div>
        <div class="grain-overlay absolute inset-0 pointer-events-none"></div>
      </div>
    {/if}

  </div>

  <!-- Scroll cue -->
  <div bind:this={scrollEl}
       class="absolute bottom-10 left-6 flex flex-col items-start gap-2">
    <span class="sec-num" style="font-size:0.6rem;color:var(--border)">SCROLL</span>
    <div class="w-px h-12 overflow-hidden" style="background:var(--border)">
      <div class="w-full h-full scroll-cue" style="background:var(--muted)"></div>
    </div>
  </div>

</section>

<style>
  .name-clip { overflow: hidden; line-height: 0.92; }

  .hero-name {
    font-size: clamp(3rem, 6.8vw, 6.2rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 0.9;
    color: var(--text);
  }
  .hero-sub {
    font-size: clamp(1.8rem, 4.2vw, 3.8rem);
    color: var(--muted);
  }

  .hero-photo {
    aspect-ratio: 3 / 4;
    max-height: 80vh;
  }

  /* Permanently black & white in the hero */
  .photo-bw {
    filter: grayscale(1) contrast(1.08) brightness(0.88) saturate(0);
  }

  .grain-overlay {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.055;
    mix-blend-mode: overlay;
  }
</style>
