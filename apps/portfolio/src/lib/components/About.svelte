<script>
  import { onMount, onDestroy } from 'svelte';
  import { reveal } from '$lib/actions/reveal.js';
  import { useGSAP } from '$lib/gsap.js';

  export let profile = null;
  export let stats   = [];

  const fallbackStats = [
    { value: '3+',  suffix: '', label: 'Years of experience'      },
    { value: '20+', suffix: '', label: 'Projects shipped'         },
    { value: '4',   suffix: '', label: 'Domains mastered'         },
    { value: '10+', suffix: '', label: 'Certifications earned'    },
  ];

  $: displayStats = stats.length ? stats : fallbackStats;

  let headingEl, bioEl, statsEl, labelEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, ScrollTrigger, SplitText } = g;

    ctx = gsap.context(() => {

      // ── Section label draws in ─────────────────────────────────────────────
      gsap.from(labelEl, {
        opacity: 0, x: -30, duration: 0.6,
        scrollTrigger: { trigger: labelEl, start: 'top 88%' },
      });

      // ── Heading: word-by-word reveal ───────────────────────────────────────
      if (headingEl) {
        const split = new SplitText(headingEl, { type: 'words' });
        gsap.from(split.words, {
          opacity: 0,
          y: 32,
          rotateX: -18,
          duration: 0.65,
          stagger: 0.06,
          ease: 'power3.out',
          transformOrigin: 'top left',
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
            v: target,
            duration: 2.2,
            ease: 'power2.out',
            onUpdate() { el.textContent = Math.round(obj.v) + suffix; },
            scrollTrigger: {
              trigger: statsEl,
              start: 'top 78%',
              toggleActions: 'play none none none',
            },
          });

          // Stat card slide-in
          gsap.from(el.closest('.stat-card'), {
            opacity: 0, y: 28, duration: 0.55,
            delay: i * 0.1,
            ease: 'power3.out',
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

  <div class="grid lg:grid-cols-[1fr_auto] gap-16 lg:gap-24 items-start">

    <!-- Bio column -->
    <div class="space-y-6">
      <h2 bind:this={headingEl}
          class="text-3xl sm:text-4xl font-bold leading-snug tracking-tight"
          style="color: var(--text)">
        {profile?.name ?? 'Venkataraman TB'}
      </h2>

      <p bind:this={bioEl} class="text-base leading-loose" style="color: var(--muted)">
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

    <!-- Stats grid -->
    <div bind:this={statsEl} class="grid grid-cols-2 gap-8 lg:gap-10 shrink-0">
      {#each displayStats.slice(0, 4) as stat}
        <div class="stat-card text-right lg:text-left">
          <p class="stat-val text-3xl font-bold tracking-tight" style="color: var(--text)">
            {stat.value}{stat.suffix ?? ''}
          </p>
          <p class="sec-num mt-1">{stat.label}</p>
        </div>
      {/each}
    </div>

  </div>
</section>
