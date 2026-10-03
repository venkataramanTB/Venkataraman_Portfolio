<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import BandHead from './BandHead.svelte';

  export let skills = [];

  const fallbackSkills = [
    { name: 'Python',     category: 'Languages',    proficiency: 95 },
    { name: 'TypeScript', category: 'Languages',    proficiency: 88 },
    { name: 'Swift',      category: 'Languages',    proficiency: 82 },
    { name: 'SQL',        category: 'Languages',    proficiency: 85 },
    { name: 'PyTorch',    category: 'ML / AI',      proficiency: 90 },
    { name: 'LangChain',  category: 'ML / AI',      proficiency: 86 },
    { name: 'TensorFlow', category: 'ML / AI',      proficiency: 78 },
    { name: 'FastAPI',    category: 'Backend',      proficiency: 93 },
    { name: 'PostgreSQL', category: 'Backend',      proficiency: 87 },
    { name: 'Docker',     category: 'Backend',      proficiency: 80 },
    { name: 'SvelteKit',  category: 'Frontend',     proficiency: 89 },
    { name: 'React',      category: 'Frontend',     proficiency: 84 },
    { name: 'SwiftUI',    category: 'Mobile',       proficiency: 85 },
  ];

  $: source = skills?.length ? skills : fallbackSkills;

  // Group by category, preserving display_order within each group.
  $: grouped = source.reduce((acc, s) => {
    const key = s.category || 'General';
    (acc[key] ??= []).push(s);
    return acc;
  }, {});
  $: categories = Object.keys(grouped);

  // Marquee needs enough items to fill twice over
  $: marqueeItems = [...source, ...source];

  let trackEl, gridEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      // Infinite mechanical ticker — constant rate, no easing
      if (trackEl) {
        requestAnimationFrame(() => {
          const half = trackEl.scrollWidth / 2;
          if (!half) return;
          gsap.to(trackEl, {
            x: -half,
            ease: 'none',
            duration: Math.max(20, source.length * 1.5),
            repeat: -1,
          });
        });
      }

      if (gridEl) {
        gridEl.querySelectorAll('.cat').forEach((row) => {
          // Only the gauge fill animates — it carries the value. The category
          // block itself stays put rather than fading in like everything else.
          gsap.from(row.querySelectorAll('.bar-fill'), {
            scaleX: 0,
            duration: 0.85,
            stagger: 0.04,
            ease: 'expo.out',
            transformOrigin: 'left',
            scrollTrigger: { trigger: row, start: 'top 88%' },
          });
        });
      }
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="stack" class="band">
  <div class="shell">
    <BandHead index="04" title="Stack" meta="{source.length} entries" />

    <!-- Ticker -->
    <div class="ticker marquee-outer" aria-hidden="true">
      <div bind:this={trackEl} class="marquee-track">
        {#each marqueeItems as skill, i}
          <span class="tick-item">{skill.name}</span>
          <span class="tick-sep">{i % 3 === 0 ? '///' : '·'}</span>
        {/each}
      </div>
    </div>

    <!-- Categorised proficiency table -->
    <div bind:this={gridEl} class="cats">
      {#each categories as cat, ci}
        <section class="cat">
          <div class="cat-head">
            <span class="t-idx">{String(ci + 1).padStart(2, '0')}</span>
            <h3 class="cat-title">{cat}</h3>
            <span class="t-micro cat-count">{grouped[cat].length}</span>
          </div>

          <div class="bars">
            {#each grouped[cat] as skill}
              <div class="bar-row">
                <span class="bar-name">{skill.name}</span>
                <span class="bar" role="img"
                      aria-label="{skill.name}: {skill.proficiency ?? 80} out of 100">
                  <span class="bar-fill" style="width: {Math.min(100, Math.max(0, skill.proficiency ?? 80))}%"></span>
                </span>
                <span class="bar-val t-data">{skill.proficiency ?? 80}</span>
              </div>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </div>
</section>

<style>
  .ticker {
    padding: 0.625rem 0;
    border-top: 1px solid var(--rule-strong);
    border-bottom: 1px solid var(--rule-strong);
    margin-bottom: clamp(2rem, 5vh, 3rem);
  }
  .tick-item {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.8125rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--ink);
    white-space: nowrap;
  }
  .tick-sep {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--hazard);
  }

  /* ─── Categories: asymmetric two-column, not an even 3-up ──────────────── */
  .cats {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
  }
  @media (min-width: 820px) {
    .cats { grid-template-columns: repeat(2, 1fr); }
    /* With an odd number of categories the final cell would leave the grid
       background showing as a dead grey block — span it across instead. */
    .cat:last-child:nth-child(odd) { grid-column: 1 / -1; }
  }

  .cat {
    background: var(--paper);
    padding: 1.125rem 1.25rem 1.375rem;
  }

  .cat-head {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    margin-bottom: 0.875rem;
    border-bottom: 1px solid var(--rule-strong);
  }
  .cat-title {
    margin: 0;
    flex: 1;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.875rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .cat-count { color: var(--ink-4); }

  /* ─── Bars ─────────────────────────────────────────────────────────────── */
  .bars { display: flex; flex-direction: column; gap: 0.5rem; }

  .bar-row {
    display: grid;
    grid-template-columns: minmax(0, 8rem) 1fr 2rem;
    gap: 0.75rem;
    align-items: center;
  }
  .bar-name {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    color: var(--ink-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Dot-matrix track with a solid ink fill — reads as an instrument gauge */
  .bar {
    display: block;
    height: 7px;
    background-image: radial-gradient(var(--rule-strong) 0.6px, transparent 0.6px);
    background-size: 3px 3px;
    background-color: var(--paper-sunk);
    position: relative;
  }
  .bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--ink);
    will-change: transform;
  }
  .bar-row:hover .bar-fill { background: var(--hazard); }

  .bar-val {
    text-align: right;
    color: var(--ink-4);
    font-size: 0.6875rem;
  }

  @media (max-width: 420px) {
    .bar-row { grid-template-columns: minmax(0, 1fr) 2rem; }
    .bar { grid-column: 1 / -1; grid-row: 2; }
  }
</style>
