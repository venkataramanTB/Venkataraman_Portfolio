<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import BandHead from './BandHead.svelte';

  export let profile = null;
  export let stats   = [];

  const fallbackStats = [
    { value: '3',  suffix: '+', label: 'Years building' },
    { value: '24', suffix: '',  label: 'Projects shipped' },
    { value: '4',  suffix: '',  label: 'Disciplines' },
    { value: '12', suffix: '+', label: 'Certifications' },
  ];

  $: displayStats = (stats?.length ? stats : fallbackStats).slice(0, 4);

  let bioEl, statsEl, asideEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, SplitText } = g;

    ctx = gsap.context(() => {
      // Bio: line-by-line mechanical reveal from behind a clip edge
      if (bioEl) {
        const split = new SplitText(bioEl, { type: 'lines', linesClass: 'clip-line' });
        gsap.from(split.lines, {
          yPercent: 100,
          opacity: 0,
          duration: 0.7,
          stagger: 0.055,
          ease: 'expo.out',
          scrollTrigger: { trigger: bioEl, start: 'top 85%' },
        });
      }

      // Stats count up on their tabular numerals
      if (statsEl) {
        statsEl.querySelectorAll('.stat').forEach((card, i) => {
          const stat   = displayStats[i];
          const valEl  = card.querySelector('.stat-val');
          if (!stat || !valEl) return;

          const target = parseInt(String(stat.value).replace(/\D/g, ''), 10) || 0;
          const suffix = String(stat.value).replace(/^\d+/, '') + (stat.suffix ?? '');
          const obj    = { v: 0 };

          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate() { valEl.textContent = Math.round(obj.v) + suffix; },
            scrollTrigger: { trigger: statsEl, start: 'top 82%', toggleActions: 'play none none none' },
          });

          gsap.from(card, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: i * 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: statsEl, start: 'top 86%' },
          });
        });
      }

    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="about" class="band">
  <div class="shell">
    <BandHead index="01" title="Abstract" />

    <div class="about-grid">
      <!-- Primary statement -->
      <div class="about-main">
        <p bind:this={bioEl} class="statement">
          {profile?.bio ??
            'I build intelligent systems end to end — training and serving models, wiring LLM agents into real products, and shipping the native apps and backends that carry them.'}
        </p>
      </div>

      <!-- Hard facts, right-aligned definition list -->
      <aside bind:this={asideEl} class="about-aside">
        <dl class="facts">
          {#if profile?.name}
            <div class="fact">
              <dt class="t-micro">Operator</dt>
              <dd class="t-data">{profile.name}</dd>
            </div>
          {/if}
          {#if profile?.location}
            <div class="fact">
              <dt class="t-micro">Station</dt>
              <dd class="t-data">{profile.location}</dd>
            </div>
          {/if}
          {#if profile?.email}
            <div class="fact">
              <dt class="t-micro">Channel</dt>
              <dd class="t-data"><a href="mailto:{profile.email}" class="link">{profile.email}</a></dd>
            </div>
          {/if}
          {#if profile?.phone}
            <div class="fact">
              <dt class="t-micro">Voice</dt>
              <dd class="t-data">{profile.phone}</dd>
            </div>
          {/if}
          <div class="fact">
            <dt class="t-micro">Status</dt>
            <dd class="t-data status">
              <span class="dot" class:dot-live={profile?.open_to_work !== false} aria-hidden="true"></span>
              {profile?.open_to_work !== false ? 'Open to offers' : 'Engaged'}
            </dd>
          </div>
        </dl>
      </aside>
    </div>

    <!-- Metrics: hairline grid, zero cards -->
    <div bind:this={statsEl} class="metrics grid-hairline">
      {#each displayStats as stat}
        <div class="stat">
          <output class="stat-val">{stat.value}{stat.suffix ?? ''}</output>
          <span class="t-micro stat-label">{stat.label}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .about-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: start;
    margin-bottom: clamp(2.5rem, 6vh, 4rem);
  }
  @media (min-width: 900px) {
    .about-grid { grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); }
  }

  /* The one piece of oversized editorial type in the body of the page */
  .statement {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(1.25rem, 2.9vw, 2.05rem);
    line-height: 1.22;
    letter-spacing: -0.025em;
    color: var(--ink);
    margin: 0;
    max-width: 30ch;
    text-wrap: pretty;
  }

  /* SplitText wraps each line in this — gives the clip edge to slide from */
  .statement :global(.clip-line) { overflow: hidden; }

  .facts {
    margin: 0;
    border-top: 1px solid var(--rule-strong);
  }
  .fact {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    gap: 1rem;
    align-items: baseline;
    padding: 0.625rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .fact dt { margin: 0; }
  .fact dd { margin: 0; color: var(--ink); }
  .status { display: inline-flex; align-items: center; gap: 0.45rem; }
  .dot { width: 6px; height: 6px; background: var(--ink-4); }
  .dot-live { background: var(--hazard); }

  /* ─── Metrics ──────────────────────────────────────────────────────────── */
  .metrics {
    grid-template-columns: repeat(2, 1fr);
    border: 1px solid var(--rule);
  }
  @media (min-width: 760px) {
    .metrics { grid-template-columns: repeat(4, 1fr); }
  }

  .stat {
    padding: 1.25rem 1.125rem 1.375rem;
  }
  .stat-val {
    display: block;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(2rem, 5vw, 3.25rem);
    line-height: 0.92;
    letter-spacing: -0.04em;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .stat-label {
    display: block;
    margin-top: 0.5rem;
    color: var(--ink-3);
  }
</style>
