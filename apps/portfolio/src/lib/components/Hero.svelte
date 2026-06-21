<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  export let profile     = null;
  export let socialLinks = [];

  let stripEl, line1El, line2El, rolesEl, bioEl, linksEl, photoWrapEl, imgEl, scrollEl;
  let photoVisible = true;
  let ctx;

  $: nameParts = (profile?.name ?? 'Venkataraman TB').toUpperCase().split(' ');
  $: line1     = nameParts[0];                      // VENKATARAMAN
  $: line2     = nameParts.slice(1).join(' ');       // TB
  $: year      = new Date().getFullYear();

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    // Hide photo col if image errors
    if (imgEl) imgEl.onerror = () => { photoVisible = false; };

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.08 });

      // 1. Strip slides in
      tl.from(stripEl, { opacity: 0, y: -14, duration: 0.5, ease: 'power2.out' });

      // 2. Photo: curtain wipe upward
      if (photoWrapEl) {
        tl.fromTo(photoWrapEl,
          { clipPath: 'inset(100% 0 0 0)' },
          { clipPath: 'inset(0% 0 0 0)', duration: 1.15, ease: 'power4.inOut' },
          0.08
        );
      }

      // 3. Name lines slide up from clip
      tl.from([line1El, line2El].filter(Boolean), {
        yPercent: 105,
        opacity:  0,
        duration: 0.9,
        stagger:  0.11,
        ease: 'power3.out',
      }, 0.22);

      // 4. Roles, bio, links fade up in sequence
      tl.from(rolesEl, { opacity: 0, y: 14, duration: 0.5 }, '-=0.35')
        .from(bioEl,   { opacity: 0, y: 12, duration: 0.5 }, '-=0.35')
        .from(linksEl?.children ?? [],
          { opacity: 0, y: 10, stagger: 0.05, duration: 0.4 }, '-=0.3')
        .from(scrollEl, { opacity: 0, duration: 0.35 }, '-=0.1');
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="home" class="relative px-6 max-w-6xl mx-auto" style="min-height:100svh">

  <!-- ── Strip ──────────────────────────────────────────────────────────────── -->
  <div bind:this={stripEl}
       class="flex items-center justify-between pt-28 pb-5 border-b border-[var(--border)]">
    <span class="inline-flex items-center gap-2 sec-num tracking-[0.16em]">
      {#if profile?.open_to_work !== false}
        <span class="w-1.5 h-1.5 rounded-full animate-pulse"
              style="background:var(--accent)"></span>
      {/if}
      AVAILABLE FOR OPPORTUNITIES
    </span>
    <span class="sec-num" style="color:var(--muted)">©{year}</span>
  </div>

  <!-- ── Main grid ──────────────────────────────────────────────────────────── -->
  <div class="grid {photoVisible ? 'lg:grid-cols-[1fr_min(36%,390px)]' : ''} gap-x-14 items-start pt-10 pb-28">

    <!-- Left: name + content -->
    <div class="flex flex-col">

      <!-- Name — each line wrapped for clip reveal -->
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

      <!-- Social / CTA links -->
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

    <!-- Right: profile photo -->
    {#if photoVisible}
      <div bind:this={photoWrapEl} class="hero-photo sticky top-24 overflow-hidden">
        <img
          bind:this={imgEl}
          src="/profile_picture.png"
          alt={profile?.name ?? 'Venkataraman TB'}
          class="w-full h-full object-cover object-top block photo-img"
        />
        <!-- Fade photo into page background at bottom -->
        <div class="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
             style="background:linear-gradient(to bottom, transparent, var(--bg) 96%)">
        </div>
        <!-- Subtle grain for depth/texture -->
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
  /* ── Clip wrapper for slide-up name reveal ── */
  .name-clip {
    overflow: hidden;
    line-height: 0.92;
  }

  /* ── Display name ── */
  .hero-name {
    font-size: clamp(3rem, 6.8vw, 6.2rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 0.9;
    color: var(--text);
  }
  /* "TB" — slightly smaller, muted, right-aligned under headline */
  .hero-sub {
    font-size: clamp(1.8rem, 4.2vw, 3.8rem);
    color: var(--muted);
  }

  /* ── Photo ── */
  .hero-photo {
    aspect-ratio: 3 / 4;
    max-height: 80vh;
  }
  .photo-img {
    filter: contrast(1.06) brightness(0.9) saturate(0.92);
    transition: filter 0.5s ease;
  }
  .hero-photo:hover .photo-img {
    filter: contrast(1.04) brightness(0.95) saturate(1.0);
  }

  /* ── SVG noise grain overlay ── */
  .grain-overlay {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.055;
    mix-blend-mode: overlay;
  }
</style>
