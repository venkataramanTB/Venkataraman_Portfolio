<script>
  import { onMount, onDestroy } from 'svelte';
  import { reveal } from '$lib/actions/reveal.js';
  import { useGSAP } from '$lib/gsap.js';

  export let profile = null;
  export let stats   = [];

  const fallbackStats = [
    { value: '3+',  suffix: '', label: 'Years of experience'   },
    { value: '20+', suffix: '', label: 'Projects shipped'      },
    { value: '4',   suffix: '', label: 'Domains mastered'      },
    { value: '10+', suffix: '', label: 'Certifications earned' },
  ];

  $: displayStats = stats.length ? stats : fallbackStats;

  let headingEl, bioEl, statsEl, labelEl;
  let photoWrapEl, bwLayerEl, wipeLineEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, ScrollTrigger, SplitText } = g;

    ctx = gsap.context(() => {

      // ── Section label ──────────────────────────────────────────────────────
      gsap.from(labelEl, {
        opacity: 0, x: -30, duration: 0.6,
        scrollTrigger: { trigger: labelEl, start: 'top 88%' },
      });

      // ── PHOTO: perspective lean-in → B&W clips away → color revealed ───────
      if (photoWrapEl && bwLayerEl) {
        const photoTl = gsap.timeline({
          scrollTrigger: { trigger: photoWrapEl, start: 'top 68%', once: true },
        });

        // Step 1: card leans in from a slight Y tilt (gives a "flip" impression)
        photoTl.fromTo(photoWrapEl,
          { rotationY: -14, transformPerspective: 1400, opacity: 0 },
          { rotationY: 0,   opacity: 1, duration: 0.65, ease: 'power3.out' },
          0
        );

        // Step 2: B&W overlay clips away left → right, color photo bleeds in
        photoTl.fromTo(bwLayerEl,
          { clipPath: 'inset(0 0 0 0%)' },
          { clipPath: 'inset(0 0 0 100%)', duration: 1.5, ease: 'expo.inOut' },
          0.22
        );

        // Step 3: bright wipe line rides the clip boundary
        if (wipeLineEl) {
          photoTl.fromTo(wipeLineEl,
            { left: '0%', opacity: 1 },
            { left: '100%', opacity: 0, duration: 1.5, ease: 'expo.inOut' },
            0.22
          );
        }

        // Step 4: color glow blooms when photo is fully revealed
        photoTl.to(photoWrapEl, {
          boxShadow: '0 0 0 1px rgba(6,182,212,0.14), 0 22px 60px rgba(6,182,212,0.10), 0 0 90px rgba(139,92,246,0.06)',
          duration: 0.75,
          ease: 'power2.out',
        }, '-=0.35');
      }

      // ── Heading: word-by-word reveal ───────────────────────────────────────
      if (headingEl) {
        const split = new SplitText(headingEl, { type: 'words' });
        gsap.from(split.words, {
          opacity: 0, y: 32, rotateX: -18, duration: 0.65, stagger: 0.06,
          ease: 'power3.out', transformOrigin: 'top left',
          scrollTrigger: { trigger: headingEl, start: 'top 85%' },
        });
      }

      // ── Bio paragraph ──────────────────────────────────────────────────────
      gsap.from(bioEl, {
        opacity: 0, y: 24, duration: 0.7,
        scrollTrigger: { trigger: bioEl, start: 'top 85%' },
      });

      // ── Stats count-up ─────────────────────────────────────────────────────
      if (statsEl) {
        const numEls = statsEl.querySelectorAll('.stat-val');
        numEls.forEach((el, i) => {
          const stat   = displayStats[i];
          if (!stat) return;
          const target = parseInt(stat.value) || 0;
          const suffix = stat.value.replace(/^\d+/, '') + (stat.suffix ?? '');
          const obj    = { v: 0 };

          gsap.to(obj, {
            v: target, duration: 2.2, ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(obj.v) + suffix; },
            scrollTrigger: {
              trigger: statsEl, start: 'top 78%',
              toggleActions: 'play none none none',
            },
          });

          gsap.from(el.closest('.stat-card'), {
            opacity: 0, y: 28, duration: 0.55,
            delay: i * 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: statsEl, start: 'top 82%' },
          });
        });
      }

    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="about" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <!-- Section label -->
  <div bind:this={labelEl} class="mb-14">
    <span class="sec-num text-gradient">01 / About</span>
  </div>

  <!-- Main grid: photo left, bio right -->
  <div class="grid lg:grid-cols-[min(300px,38%)_1fr] gap-12 lg:gap-20 mb-20 items-start">

    <!-- Photo: B&W → Color reveal on scroll -->
    <div bind:this={photoWrapEl} class="photo-wrap">
      <div class="relative overflow-hidden" style="aspect-ratio:3/4">

        <!-- Color photo (always underneath) -->
        <img
          src="/profile_picture.png"
          alt=""
          class="absolute inset-0 w-full h-full object-cover object-top"
          aria-hidden="true"
          style="filter:contrast(1.06) brightness(0.95) saturate(1.05)"
        />

        <!-- B&W overlay (clips away from left → right on scroll) -->
        <img
          bind:this={bwLayerEl}
          src="/profile_picture.png"
          alt={profile?.name ?? 'Venkataraman TB'}
          class="bw-layer absolute inset-0 w-full h-full object-cover object-top"
        />

        <!-- Wipe line: thin light bar at the clip boundary -->
        <div bind:this={wipeLineEl} class="wipe-line" aria-hidden="true"></div>

        <!-- Bottom gradient -->
        <div class="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
             style="background:linear-gradient(to bottom,transparent,rgba(8,8,8,0.55) 100%)">
        </div>
      </div>
    </div>

    <!-- Bio column -->
    <div class="space-y-6">
      <h2 bind:this={headingEl}
          class="text-3xl sm:text-4xl font-bold leading-snug tracking-tight"
          style="color:var(--text)">
        {profile?.name ?? 'Venkataraman TB'}
      </h2>

      <p bind:this={bioEl} class="text-base leading-loose" style="color:var(--muted)">
        {profile?.bio ?? 'I architect intelligent systems that span the full stack — from training ML models and shipping LLM-powered agents to building pixel-perfect iOS apps and high-throughput web backends.'}
      </p>

      {#if profile?.location || profile?.email}
        <div use:reveal={{ delay: 220 }} class="flex flex-wrap gap-5 pt-2">
          {#if profile?.location}
            <span class="sec-num">📍 {profile.location}</span>
          {/if}
          {#if profile?.email}
            <a href="mailto:{profile.email}"
               class="sec-num hover:text-[var(--text)] transition-colors duration-200">
              {profile.email}
            </a>
          {/if}
        </div>
      {/if}
    </div>

  </div>

  <!-- Stats strip -->
  <div bind:this={statsEl} class="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-10">
    {#each displayStats.slice(0, 4) as stat}
      <div class="stat-card text-left">
        <p class="stat-val text-3xl font-bold tracking-tight" style="color:var(--text)">
          {stat.value}{stat.suffix ?? ''}
        </p>
        <p class="sec-num mt-1">{stat.label}</p>
      </div>
    {/each}
  </div>

</section>

<style>
  /* GSAP will tween rotationY + opacity via will-change */
  .photo-wrap {
    will-change: transform, opacity, box-shadow;
  }

  /* Starts fully covering the color image; GSAP clips it away left → right */
  .bw-layer {
    filter: grayscale(1) contrast(1.08) brightness(0.92) saturate(0);
    clip-path: inset(0 0 0 0%);
  }

  /* Thin bright edge that rides the wipe boundary */
  .wipe-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(255, 255, 255, 0.55) 25%,
      rgba(255, 255, 255, 0.80) 50%,
      rgba(255, 255, 255, 0.55) 75%,
      transparent 100%
    );
    z-index: 20;
    opacity: 0;
    pointer-events: none;
  }
</style>
