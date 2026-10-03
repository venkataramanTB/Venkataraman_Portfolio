<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import BandHead from './BandHead.svelte';
  import Icon from './Icon.svelte';

  export let projects = [];

  // Featured first, then the rest — but all in one continuous index.
  $: display = [
    ...projects.filter((p) => p.is_featured),
    ...projects.filter((p) => !p.is_featured),
  ];

  let listEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      if (!listEl) return;

      listEl.querySelectorAll('.proj').forEach((row, i) => {
        // Hard horizontal wipe — the row is printed onto the page
        gsap.from(row, {
          clipPath: 'inset(0 100% 0 0)',
          duration: 0.75,
          delay: (i % 5) * 0.05,
          ease: 'expo.out',
          scrollTrigger: { trigger: row, start: 'top 90%' },
        });
      });
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="projects" class="band">
  <div class="shell">
    <BandHead
      index="03"
      title="Build Index"
      meta="{display.length} {display.length === 1 ? 'unit' : 'units'}"
    />

    {#if display.length}
      <div bind:this={listEl} class="index">
        <div class="index-head" aria-hidden="true">
          <span>Idx</span>
          <span>Designation</span>
          <span>Class</span>
          <span>Links</span>
        </div>

        {#each display as proj, i}
          <article class="proj">
            <a
              class="proj-hit"
              href="/work/{proj.id}"
              aria-label="Open case file for {proj.title}"
            >
              <span class="t-idx proj-idx">{String(i + 1).padStart(3, '0')}</span>

              <div class="proj-body">
                <h3 class="proj-title">
                  {proj.title}
                  {#if proj.is_featured}
                    <span class="flag">Key</span>
                  {/if}
                </h3>

                {#if proj.description}
                  <p class="proj-desc">{proj.description}</p>
                {/if}

                {#if proj.technologies?.length}
                  <ul class="techs">
                    {#each proj.technologies.slice(0, 7) as tech}
                      <li><span class="tag">{tech}</span></li>
                    {/each}
                    {#if proj.technologies.length > 7}
                      <li><span class="tag">+{proj.technologies.length - 7}</span></li>
                    {/if}
                  </ul>
                {/if}
              </div>

              <span class="proj-class t-data">{proj.category ?? '—'}</span>

              <span class="proj-arrow"><Icon name="arrow-right" size={16} /></span>
            </a>

            <!-- External links sit outside the row link so they stay independently clickable -->
            {#if proj.demo_url || proj.github_url || proj.appstore_url}
              <div class="proj-links">
                {#if proj.demo_url}
                  <a href={proj.demo_url} target="_blank" rel="noopener noreferrer"
                     class="iconlink" aria-label="Live deployment" title="Live deployment">
                    <Icon name="site" size={16} /></a>
                {/if}
                {#if proj.github_url}
                  <a href={proj.github_url} target="_blank" rel="noopener noreferrer"
                     class="iconlink" aria-label="Source repository" title="Source repository">
                    <Icon name="github" size={16} /></a>
                {/if}
                {#if proj.appstore_url}
                  <a href={proj.appstore_url} target="_blank" rel="noopener noreferrer"
                     class="iconlink" aria-label="App Store listing" title="App Store listing">
                    <Icon name="external" size={16} /></a>
                {/if}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty">
        <span class="t-micro">&#91; Index empty &#93;</span>
        <p class="t-body empty-copy">
          Builds are loaded from the admin panel. Each one gets a numbered entry here
          and its own case file.
        </p>
        <div class="empty-skel">
          {#each Array(4) as _}
            <div class="skel skel-row"></div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .index { border-top: 1px solid var(--rule-strong); }

  .index-head {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr) 8rem 6rem;
    gap: 1.25rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .index-head > span {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-4);
  }

  .proj {
    border-bottom: 1px solid var(--rule);
    position: relative;
    will-change: clip-path;
  }

  /* Whole row is the target; the links row below opts out */
  .proj-hit {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr) 8rem 6rem;
    gap: 1.25rem;
    align-items: start;
    padding: 1.5rem 0.5rem 1.25rem;
    text-decoration: none;
    color: inherit;
    transition: background-color 240ms var(--ease-out);
  }
  .proj-hit::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--hazard);
    transform: scaleY(0);
    transform-origin: top;
    transition: transform 280ms var(--ease-mech);
  }
  .proj-hit:hover { background: var(--paper-sunk); }
  .proj-hit:hover::before { transform: scaleY(1); }
  .proj-hit:hover .proj-idx { color: var(--hazard); }
  .proj-hit:hover .proj-title { color: var(--hazard); }
  .proj-hit:hover .proj-arrow { transform: translateX(4px); opacity: 1; }

  .proj-idx { padding-top: 0.3rem; transition: color 240ms var(--ease-out); }

  .proj-title {
    margin: 0 0 0.375rem;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(1.0625rem, 2.1vw, 1.3125rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    color: var(--ink);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    transition: color 240ms var(--ease-out);
  }

  /* Square flag, not a pill badge */
  .flag {
    padding: 2px 6px;
    border: 1px solid var(--hazard);
    color: var(--hazard);
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .proj-desc {
    margin: 0 0 0.6875rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.65;
    color: var(--ink-2);
    max-width: 68ch;
    text-wrap: pretty;
  }

  .techs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .proj-class {
    padding-top: 0.35rem;
    color: var(--ink-3);
    text-transform: uppercase;
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
  }

  .proj-arrow {
    padding-top: 0.3rem;
    display: flex;
    justify-content: flex-end;
    color: var(--ink-4);
    opacity: 0.6;
    transition: transform 240ms var(--ease-out), opacity 240ms var(--ease-out);
  }

  .proj-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0 0.5rem 1.125rem 5.25rem;
  }

  /* Square icon cell — same affordance as the nav */
  .iconlink {
    display: inline-flex;
    padding: 0.4rem;
    border: 1px solid var(--rule);
    color: var(--ink-3);
    text-decoration: none;
    transition: color 180ms var(--ease-out), background-color 180ms var(--ease-out),
      border-color 180ms var(--ease-out);
  }
  .iconlink:hover {
    color: var(--paper);
    background: var(--ink);
    border-color: var(--ink);
  }


  @media (max-width: 820px) {
    .index-head { display: none; }
    .proj-hit {
      grid-template-columns: 3.25rem minmax(0, 1fr) auto;
      gap: 0.75rem 1rem;
    }
    .proj-class {
      grid-column: 2;
      grid-row: 2;
      padding-top: 0;
    }
    .proj-links { padding-left: 4.25rem; }
  }

  /* ─── Empty state ──────────────────────────────────────────────────────── */
  .empty { border: 1px solid var(--rule); padding: 1.5rem; }
  .empty-copy { margin: 0.75rem 0 1.25rem; }
  .empty-skel { display: flex; flex-direction: column; gap: 0.5rem; }
  .skel-row { height: 2.25rem; }
  .skel-row:nth-child(2) { width: 88%; }
  .skel-row:nth-child(3) { width: 70%; }
  .skel-row:nth-child(4) { width: 55%; }
</style>
